const hre = require("hardhat");
const secret = require("../secret");
const erc20 = require ("../utils/erc20.json");
const poolABI = require("../utils/pool.json");
const Web3 = require('web3');
const { ethers } = require("hardhat");
const web3 = new Web3(secret.rinkeby);

function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
      currentDate = Date.now();
    } while (currentDate - date < milliseconds);
  }

async function main() {
    // Hardhat always runs the compile task when running scripts with its command
    // line interface.
    //
    // If this script is run directly using `node` you may want to call compile
    // manually to make sure everything is compiled
    // await hre.run('compile');
  
    // We get the contract to deploy
    const AaveSearcher = await hre.ethers.getContractFactory("AaveSearcher");
    const swapRouter02 = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45";
    const poolAddressProviderAddr = '0xBA6378f1c1D046e9EB0F538560BA7558546edF3C';
    const IPoolAddressProvider = await hre.ethers.getContractAt(poolAddressProviderABI, poolAddressProviderAddr)
    console.log(IPoolAddressProvider.address)
    //console.log(IPoolAddressProvider)
    const aaveSearcher = await AaveSearcher.deploy(IPoolAddressProvider.address, swapRouter02);
    await aaveSearcher.deployed();
    console.log(aaveSearcher.address)

    const provider = ethers.getDefaultProvider(secret.rinkeby);

    const depositor = '0x53607A7DDFb72893579AC2aA18D62d586244a6C2';
    const depositorSigner = new hre.ethers.Wallet('0x197fd9a571a9f7f7ac3e072743eb8c46aa11daf0c7d542f120db8e7e9cd72d22', provider);
    const borrower = '0x1Cf0b26c63817Bfd467630D247A32529091fde49';
    const borrowerSigner = new hre.ethers.Wallet("0x0662c9d03d341b1d16fb7f0f9fc7e1e6194c4c57ec338c0011f0b875c3279c45", provider);
    const liquidator = "0x3be0dDA9B3657B63c2cd9e836E41903c97518088";

    const rinkWETH = "0xd74047010D77c5901df5b0f9ca518aED56C85e8D";
    const rinkUSDC = "0xb18d016cDD2d9439A19f15633005A6b2cd6Aa774";

    // // mint USDC to depositor
    // const USDCTokenContract = await hre.ethers.getContractAt(erc20, rinkUSDC);
    // await USDCTokenContract._mint(depositor.address, 1000000000000000000000);

    // USDC sent to depositor

    // get pool
    const poolAddr = await IPoolAddressProvider.getPool();
    const poolContract = await hre.ethers.getContractAt(poolABI, poolAddr)

    //approve protocol to access depositor wallet
    const USDCTokenContract = await hre.ethers.getContractAt(erc20, rinkUSDC);
    const approveData = await USDCTokenContract.connect(depositorSigner).approve("0x87530ED4bd0ee0e79661D65f8Dd37538F693afD5", '1000000000000000000000000000000000');
    const approveData2 = await USDCTokenContract.connect(depositorSigner).approve(poolAddr, '1000000000000000000000000000000000');

    const mint = await USDCTokenContract.connect(depositorSigner).mint(depositor, 900000000);
    
    console.log(approveData)
    console.log(mint)

    //console.log(poolContract)

    //depositor deposits 20 USDC
    const depositorDeposit = await poolContract.connect(depositorSigner).supply(rinkUSDC, 200000000, depositor, '0');
    depositorDeposit.wait();
    console.log(depositorDeposit)

    sleep(60000)

    //borrower deposits 0.002 WETH
    const WETHTokenContract = await hre.ethers.getContractAt(erc20, rinkWETH);
    const approveData3 = await WETHTokenContract.connect(borrowerSigner).approve("0x87530ED4bd0ee0e79661D65f8Dd37538F693afD5", '10000000000000000000000000');
    approveData3.wait();
    const approveData4 = await WETHTokenContract.connect(borrowerSigner).approve(poolAddr, '10000000000000000000000000');
    approveData4.wait()

    sleep(10000)

    const mint2 = await WETHTokenContract.connect(borrowerSigner).mint(borrower, 9000000000000000)
    mint2.wait();

    sleep(10000)

    const borrowerDeposit = await poolContract.connect(borrowerSigner).supply(rinkWETH, 2000000000000000, borrower, '0');
    borrowerDeposit.wait()
    console.log(borrowerDeposit)

    const userGlobalData = await poolContract.getUserAccountData(borrower);

    const oracleAddr = "0xA323726989db5708B19EAd4A494dDe09F3cEcc69"
    const oracleContract = await hre.ethers.getContractAt(erc20, oracleAddr);

    const usdcPrice = await oracle.getAssetPrice(usdc.address);


    //borrower borrows
//     const userGlobalData = await pool.getUserAccountData(borrower.address);

//     const usdcPrice = await oracle.getAssetPrice(usdc.address);

//     const amountUSDCToBorrow = await convertToCurrencyDecimals(
//       usdc.address,
//       new BigNumber(userGlobalData.availableBorrowsETH.toString())
//         .div(usdcPrice.toString())
//         .multipliedBy(0.9502)
//         .toFixed(0)
//     );

//     await pool
//       .connect(borrower.signer)
//       .borrow(usdc.address, amountUSDCToBorrow, RateMode.Stable, '0', borrower.address);
    

      // SWAP WETH TO DAI
    //   const rinkWETH = "0xc778417E063141139Fce010982780140Aa0cD5Ab";
    //   const rinkUSDC = "0x4DBCdF9B62e891a7cec5A2568C3F4FAF9E8Abe2b";

    //   const wethTokenContract = await hre.ethers.getContractAt(erc20ABI, rinkWETH)
    //   //console.log(wethTokenContract)
    //   const approveData = await wethTokenContract.approve(aaveSearcher.address, 200000000000000)
    //   console.log(approveData)
  
    //   const res = await aaveSearcher.swapExactInputSingle(100000000000000, 0, rinkWETH, rinkUSDC, 3000);
    //   console.log(res)
  }
  
  // We recommend this pattern to be able to use async/await everywhere
  // and properly handle errors.
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
  


// it('User 3 deposits 1000 USDC, user 4 1 WETH, user 4 borrows - drops HF, liquidates the borrow', async () => {
//     const { usdc, users, pool, oracle, weth, helpersContract } = testEnv;

//     const depositor = users[3];
//     const borrower = users[4];
//     const liquidator = users[5];

//     //mints USDC to depositor
//     await usdc
//       .connect(depositor.signer)
//       .mint(await convertToCurrencyDecimals(usdc.address, '1000'));

//     //approve protocol to access depositor wallet
//     await usdc.connect(depositor.signer).approve(pool.address, APPROVAL_AMOUNT_LENDING_POOL);

//     //depositor deposits 1000 USDC
//     const amountUSDCtoDeposit = await convertToCurrencyDecimals(usdc.address, '1000');

//     await pool
//       .connect(depositor.signer)
//       .deposit(usdc.address, amountUSDCtoDeposit, depositor.address, '0');

//     //borrower deposits 1 ETH
//     const amountETHtoDeposit = await convertToCurrencyDecimals(weth.address, '1');

//     //mints WETH to borrower
//     await weth.connect(borrower.signer).mint(await convertToCurrencyDecimals(weth.address, '1000'));

//     //approve protocol to access the borrower wallet
//     await weth.connect(borrower.signer).approve(pool.address, APPROVAL_AMOUNT_LENDING_POOL);

//     await pool
//       .connect(borrower.signer)
//       .deposit(weth.address, amountETHtoDeposit, borrower.address, '0');

//     //borrower borrows
//     const userGlobalData = await pool.getUserAccountData(borrower.address);

//     const usdcPrice = await oracle.getAssetPrice(usdc.address);

//     const amountUSDCToBorrow = await convertToCurrencyDecimals(
//       usdc.address,
//       new BigNumber(userGlobalData.availableBorrowsETH.toString())
//         .div(usdcPrice.toString())
//         .multipliedBy(0.9502)
//         .toFixed(0)
//     );

//     await pool
//       .connect(borrower.signer)
//       .borrow(usdc.address, amountUSDCToBorrow, RateMode.Stable, '0', borrower.address);

//     //drops HF below 1
//     await oracle.setAssetPrice(
//       usdc.address,
//       new BigNumber(usdcPrice.toString()).multipliedBy(1.12).toFixed(0)
//     );

//     //mints dai to the liquidator

//     await usdc
//       .connect(liquidator.signer)
//       .mint(await convertToCurrencyDecimals(usdc.address, '1000'));

//     //approve protocol to access depositor wallet
//     await usdc.connect(liquidator.signer).approve(pool.address, APPROVAL_AMOUNT_LENDING_POOL);

//     const userReserveDataBefore = await helpersContract.getUserReserveData(
//       usdc.address,
//       borrower.address
//     );

//     const usdcReserveDataBefore = await helpersContract.getReserveData(usdc.address);
//     const ethReserveDataBefore = await helpersContract.getReserveData(weth.address);

//     const amountToLiquidate = DRE.ethers.BigNumber.from(
//       userReserveDataBefore.currentStableDebt.toString()
//     )
//       .div(2)
//       .toString();

//     await pool
//       .connect(liquidator.signer)
//       .liquidationCall(weth.address, usdc.address, borrower.address, amountToLiquidate, false);

//     const userReserveDataAfter = await helpersContract.getUserReserveData(
//       usdc.address,
//       borrower.address
//     );

//     const userGlobalDataAfter = await pool.getUserAccountData(borrower.address);

//     const usdcReserveDataAfter = await helpersContract.getReserveData(usdc.address);
//     const ethReserveDataAfter = await helpersContract.getReserveData(weth.address);

//     const collateralPrice = await oracle.getAssetPrice(weth.address);
//     const principalPrice = await oracle.getAssetPrice(usdc.address);

//     const collateralDecimals = (
//       await helpersContract.getReserveConfigurationData(weth.address)
//     ).decimals.toString();
//     const principalDecimals = (
//       await helpersContract.getReserveConfigurationData(usdc.address)
//     ).decimals.toString();

//     const expectedCollateralLiquidated = new BigNumber(principalPrice.toString())
//       .times(new BigNumber(amountToLiquidate).times(105))
//       .times(new BigNumber(10).pow(collateralDecimals))
//       .div(
//         new BigNumber(collateralPrice.toString()).times(new BigNumber(10).pow(principalDecimals))
//       )
//       .div(100)
//       .decimalPlaces(0, BigNumber.ROUND_DOWN);

//     expect(userGlobalDataAfter.healthFactor.toString()).to.be.bignumber.gt(
//       oneEther.toFixed(0),
//       'Invalid health factor'
//     );

//     expect(userReserveDataAfter.currentStableDebt.toString()).to.be.bignumber.almostEqual(
//       new BigNumber(userReserveDataBefore.currentStableDebt.toString())
//         .minus(amountToLiquidate)
//         .toFixed(0),
//       'Invalid user borrow balance after liquidation'
//     );

//     //the liquidity index of the principal reserve needs to be bigger than the index before
//     expect(usdcReserveDataAfter.liquidityIndex.toString()).to.be.bignumber.gte(
//       usdcReserveDataBefore.liquidityIndex.toString(),
//       'Invalid liquidity index'
//     );

//     //the principal APY after a liquidation needs to be lower than the APY before
//     expect(usdcReserveDataAfter.liquidityRate.toString()).to.be.bignumber.lt(
//       usdcReserveDataBefore.liquidityRate.toString(),
//       'Invalid liquidity APY'
//     );

//     expect(usdcReserveDataAfter.availableLiquidity.toString()).to.be.bignumber.almostEqual(
//       new BigNumber(usdcReserveDataBefore.availableLiquidity.toString())
//         .plus(amountToLiquidate)
//         .toFixed(0),
//       'Invalid principal available liquidity'
//     );

//     expect(ethReserveDataAfter.availableLiquidity.toString()).to.be.bignumber.almostEqual(
//       new BigNumber(ethReserveDataBefore.availableLiquidity.toString())
//         .minus(expectedCollateralLiquidated)
//         .toFixed(0),
//       'Invalid collateral available liquidity'
//     );
//   });

  const poolAddressProviderABI = [{"inputs":[{"internalType":"string","name":"marketId","type":"string"},{"internalType":"address","name":"owner","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"oldAddress","type":"address"},{"indexed":true,"internalType":"address","name":"newAddress","type":"address"}],"name":"ACLAdminUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"oldAddress","type":"address"},{"indexed":true,"internalType":"address","name":"newAddress","type":"address"}],"name":"ACLManagerUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"id","type":"bytes32"},{"indexed":true,"internalType":"address","name":"oldAddress","type":"address"},{"indexed":true,"internalType":"address","name":"newAddress","type":"address"}],"name":"AddressSet","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"id","type":"bytes32"},{"indexed":true,"internalType":"address","name":"proxyAddress","type":"address"},{"indexed":false,"internalType":"address","name":"oldImplementationAddress","type":"address"},{"indexed":true,"internalType":"address","name":"newImplementationAddress","type":"address"}],"name":"AddressSetAsProxy","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"string","name":"oldMarketId","type":"string"},{"indexed":true,"internalType":"string","name":"newMarketId","type":"string"}],"name":"MarketIdSet","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"oldAddress","type":"address"},{"indexed":true,"internalType":"address","name":"newAddress","type":"address"}],"name":"PoolConfiguratorUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"oldAddress","type":"address"},{"indexed":true,"internalType":"address","name":"newAddress","type":"address"}],"name":"PoolDataProviderUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"oldAddress","type":"address"},{"indexed":true,"internalType":"address","name":"newAddress","type":"address"}],"name":"PoolUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"oldAddress","type":"address"},{"indexed":true,"internalType":"address","name":"newAddress","type":"address"}],"name":"PriceOracleSentinelUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"oldAddress","type":"address"},{"indexed":true,"internalType":"address","name":"newAddress","type":"address"}],"name":"PriceOracleUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"id","type":"bytes32"},{"indexed":true,"internalType":"address","name":"proxyAddress","type":"address"},{"indexed":true,"internalType":"address","name":"implementationAddress","type":"address"}],"name":"ProxyCreated","type":"event"},{"inputs":[],"name":"getACLAdmin","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getACLManager","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"id","type":"bytes32"}],"name":"getAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getMarketId","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getPool","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getPoolConfigurator","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getPoolDataProvider","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getPriceOracle","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getPriceOracleSentinel","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newAclAdmin","type":"address"}],"name":"setACLAdmin","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newAclManager","type":"address"}],"name":"setACLManager","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"id","type":"bytes32"},{"internalType":"address","name":"newAddress","type":"address"}],"name":"setAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"id","type":"bytes32"},{"internalType":"address","name":"newImplementationAddress","type":"address"}],"name":"setAddressAsProxy","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"newMarketId","type":"string"}],"name":"setMarketId","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newPoolConfiguratorImpl","type":"address"}],"name":"setPoolConfiguratorImpl","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newDataProvider","type":"address"}],"name":"setPoolDataProvider","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newPoolImpl","type":"address"}],"name":"setPoolImpl","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newPriceOracle","type":"address"}],"name":"setPriceOracle","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newPriceOracleSentinel","type":"address"}],"name":"setPriceOracleSentinel","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}]