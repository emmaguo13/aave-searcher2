const hre = require("hardhat");
const secret = require("../secret");
const erc20 = require ("../utils/erc20.json");
const poolABI = require("../utils/pool.json");
const oracleABI = require("../utils/oracle.json")
const helpersABI = require("../utils/helper.json")
const poolAddressProviderABI = require("../utils/poolAddressProv.json")
const Web3 = require('web3');
const { ethers, network } = require("hardhat");

const convertToCurrencyDecimals = async (amount, decimals) => {
    return hre.ethers.utils.parseUnits(amount, decimals);
  };

async function main() {
    // We get the contract to deploy
    const AaveSearcher = await hre.ethers.getContractFactory("AaveSearcher");
    const swapRouter02 = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45";

    // Get PoolAddressProvider
    const poolAddressProviderAddr = '0xBA6378f1c1D046e9EB0F538560BA7558546edF3C';
    const IPoolAddressProvider = await hre.ethers.getContractAt(poolAddressProviderABI, poolAddressProviderAddr)

    const aaveSearcher = await AaveSearcher.deploy(IPoolAddressProvider.address, swapRouter02);
    await aaveSearcher.deployed();

    const provider = hre.network.provider;

    // Accounts
    const depositor = '0x53607A7DDFb72893579AC2aA18D62d586244a6C2';
    await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [depositor],
      });
    const depositorSigner = await ethers.getSigner(depositor)

    const borrower = '0x1Cf0b26c63817Bfd467630D247A32529091fde49';
    await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [borrower],
      });
    const borrowerSigner = await ethers.getSigner(borrower)
    
    const liquidator = "0x3be0dDA9B3657B63c2cd9e836E41903c97518088";
    await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [liquidator],
      });
    const liquidatorSigner = await ethers.getSigner(liquidator)

    const poolAdmin = '0x77c45699A715A64A7a7796d5CEe884cf617D5254';
    await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [poolAdmin],
      });
    const poolAdminSigner = await ethers.getSigner(poolAdmin)

    // give 5 Eth to all accounts 
    
    // const newBalance = ethers.utils.parseEther("5");

    // // this is necessary because hex quantities with leading zeros are not valid at the JSON-RPC layer
    // const newBalanceHex = newBalance.toHexString().replace("0x0", "0x");
    
    // await network.provider.send("hardhat_setBalance", [
    //     depositor,
    //     newBalanceHex,
    //     ]);

    // await network.provider.send("hardhat_setBalance", [
    //     borrower,
    //     newBalanceHex,
    //     ]);
    
    // await network.provider.send("hardhat_setBalance", [
    //     liquidator,
    //     newBalanceHex,
    //     ]);

    // Tokens
    // actually polygon mainnet, but too lazy to change lol
    const rinkWETH = "0xc778417E063141139Fce010982780140Aa0cD5Ab";
    const rinkUSDC = "0x4DBCdF9B62e891a7cec5A2568C3F4FAF9E8Abe2b";
    const USDCTokenContract = await hre.ethers.getContractAt(erc20, rinkUSDC);
    const WETHTokenContract = await hre.ethers.getContractAt(erc20, rinkWETH);

    // Get pool
    const poolAddr = await IPoolAddressProvider.getPool();
    const poolContract = await hre.ethers.getContractAt(poolABI, poolAddr)

    //approve protocol to access depositor wallet
    const actualPoolAddr = "0x87530ED4bd0ee0e79661D65f8Dd37538F693afD5"
    const approveData = await USDCTokenContract.connect(depositorSigner).approve(actualPoolAddr, '1000000000000000000000000000000000');
    const approveData2 = await USDCTokenContract.connect(depositorSigner).approve(poolAddr, '1000000000000000000000000000000000');

    // Mint USDC to depositor
    //const mint = await USDCTokenContract.connect(depositorSigner).mint(depositor, 900000000);

    // check depositor balance
    const bal = await USDCTokenContract.connect(depositorSigner).balanceOf(depositor)
    console.log(bal)
    //Depositor deposits 5 USDC
    const depositorDeposit = await poolContract.connect(depositorSigner).supply(rinkUSDC, 5, depositor, '0');
    depositorDeposit.wait();

//     // approve borrower
//     const approveData3 = await WETHTokenContract.connect(borrowerSigner).approve(actualPoolAddr, '10000000000000000000000000');
//     approveData3.wait();
//     const approveData4 = await WETHTokenContract.connect(borrowerSigner).approve(poolAddr, '10000000000000000000000000');
//     approveData4.wait();

//     // Mint WETH to borrower
//     // const mint2 = await WETHTokenContract.connect(borrowerSigner).mint(borrower, 9000000000000000)
//     // mint2.wait();

//     // Borrower deposits 0.0000002 WETH
//     const borrowerDeposit = await poolContract.connect(borrowerSigner).supply(rinkWETH, 200000000000, borrower, '0');
//     borrowerDeposit.wait()

//     // Get global data of Borrower
//     const userGlobalData = await poolContract.getUserAccountData(borrower);

//     // Set up oracle
//     const oracleAddr = "0xA323726989db5708B19EAd4A494dDe09F3cEcc69"
//     const oracleContract = await hre.ethers.getContractAt(oracleABI, oracleAddr);

//     // Get amount of USDC to borrow
//     const usdcPrice = await oracleContract.getAssetPrice(USDCTokenContract.address);
//     const toMul = userGlobalData.availableBorrowsBase.div(usdcPrice.toString()).toNumber()
//     const result = (toMul * 0.9502)
//     const rounded = Math.round(result).toString()
//     const usdcToBorrow = convertToCurrencyDecimals(rounded, 6);
//     // Borrower makes the borrow
//     const borrowerBorrow = await poolContract.connect(borrowerSigner).borrow(USDCTokenContract.address, usdcToBorrow, 1, "0", borrower);
//     borrowerBorrow.wait()

//     // Get global data of Borrower
//     const userGlobalData2 = await poolContract.getUserAccountData(borrower);
//     console.log(userGlobalData2.healthFactor)

//     // GET BEFORE PRICE ORACLE
//     const beforeOracle = await IPoolAddressProvider.getPriceOracle();
//     console.log(beforeOracle)

//     // Deploy new aave oracle
//     const AaveOracle = await hre.ethers.getContractFactory("AaveOracle");

//     // IPoolAddressesProvider provider,
//     // address[] memory assets,
//     // address[] memory sources,
//     // address fallbackOracle,
//     // address baseCurrency,
//     // uint256 baseCurrencyUnit

//     const sourceWETH = await oracleContract.getSourceOfAsset(rinkWETH);
//     console.log(sourceWETH)
//     const sourceUSDC = await oracleContract.getSourceOfAsset(rinkUSDC);
//     console.log(sourceUSDC)
//     const fallback = "0x0000000000000000000000000000000000000000"
//     const baseCurr = "0x0000000000000000000000000000000000000000"

//     const aaveOracle = await AaveOracle.deploy(poolAddressProviderAddr, [rinkWETH, rinkUSDC], [sourceWETH, sourceUSDC], fallback, baseCurr, 100000000);
//     aaveOracle.deployed();
    
//     // // Set fallback oracle to price oracle
//     // await oracleContract.connect(poolAdminSigner).setFallbackOracle(
//     //     priceOracle.address
//     //   );

//     // Set pool address to new aave oracle
//     const poolAddrOwner = '0x77c45699A715A64A7a7796d5CEe884cf617D5254';
//     await hre.network.provider.request({
//         method: "hardhat_impersonateAccount",
//         params: [poolAddrOwner],
//       });
//     const poolOwnerSigner = await ethers.getSigner(poolAddrOwner)
//     await IPoolAddressProvider.connect(poolOwnerSigner).setPriceOracle(aaveOracle.address);
    
//     // GET AFTER PRICE ORACLE
//     const afterOracle = await IPoolAddressProvider.getPriceOracle();
//     console.log(afterOracle)

//     // Drop HF below 1 by setting usdc Price
//     const toSet = hre.ethers.BigNumber.from(Math.round(usdcPrice.toNumber() * 5).toString())
//     await aaveOracle.connect(poolAdminSigner).setAssetPrice(
//       USDCTokenContract.address,
//       toSet
//     );

//     // Get global data of Borrower
//     const userGlobalData3 = await poolContract.getUserAccountData(borrower);
//     console.log(userGlobalData3.healthFactor)

//     // Mint USDC to liquidator
//     // await USDCTokenContract
//     //   .connect(liquidatorSigner)
//     //   .mint(liquidator, convertToCurrencyDecimals('10000', 6));

//     // Approve protocol to access liquidator wallet 
//    const approveLiquidatorAccess = await USDCTokenContract.connect(liquidatorSigner).approve(poolAddr, '10000000000000000000000000');
//    approveLiquidatorAccess.wait();

//    // Set up Helper Contract
//     const helpersAddr = "0xBAB2E7afF5acea53a43aEeBa2BA6298D8056DcE5"
//     const helpersContract = await hre.ethers.getContractAt(helpersABI, helpersAddr);

//     // Get reserve data of borrower before liquidation
//     const userReserveDataBefore = await helpersContract.getUserReserveData(
//       USDCTokenContract.address,
//       borrower
//     );
//     const usdcReserveDataBefore = await helpersContract.getReserveData(USDCTokenContract.address);
//     console.log("USDC Resever Data")
//     console.log(usdcReserveDataBefore)

//     const ethReserveDataBefore = await helpersContract.getReserveData(WETHTokenContract.address);
//     console.log("ETH Reserve Data")
//     console.log(ethReserveDataBefore)
    
//     // Get the amount to liquidate
//     const amountToLiquidate = hre.ethers.BigNumber.from(
//       userReserveDataBefore.currentStableDebt.toString()
//     )
//       .div(2)
//       .toString();
    
//     // Mint contract USDC for initial flashloan test
//     // await USDCTokenContract
//     //   .mint(aaveSearcher.address, convertToCurrencyDecimals('1000000', 6));
    
//     // Mint liquidator WETH to test swap
//     // await WETHTokenContract.connect(liquidatorSigner)
//     //   .mint(liquidator, convertToCurrencyDecimals('10', 18));
    
//     // const liq = await aaveSearcher.connect(liquidatorSigner).liquidateLoan(rinkWETH, rinkUSDC, borrower, amountToLiquidate)
//     // console.log(liq)

//     await WETHTokenContract.connect(liquidatorSigner).approve(aaveSearcher.address, 2000000000000000)
//     const res = await aaveSearcher.connect(liquidatorSigner).swapExactInputSingle(1, 0, rinkWETH, rinkUSDC, 3000);
//     // Executes flashloan
//     // const loan = await aaveSearcher.execFlashLoan(USDCTokenContract.address, amountToLiquidate, WETHTokenContract.address, borrower, 0, 3000);
//     // console.log(loan)
  }
  
  // We recommend this pattern to be able to use async/await everywhere
  // and properly handle errors.
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });

