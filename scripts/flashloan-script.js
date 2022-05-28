const hre = require("hardhat");
const secret = require("../secret");
const erc20 = require ("../utils/erc20mintable.json");
const poolABI = require("../utils/pool.json");
const oracleABI = require("../utils/oracle.json")
const helpersABI = require("../utils/helper.json")
const poolAddressProviderABI = require("../utils/poolAddressProv.json")
const Web3 = require('web3');
const { ethers } = require("hardhat");

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

    const provider = ethers.getDefaultProvider(secret.rinkeby);

    // Accounts
    const depositor = '0x53607A7DDFb72893579AC2aA18D62d586244a6C2';
    const depositorSigner = new hre.ethers.Wallet('0x197fd9a571a9f7f7ac3e072743eb8c46aa11daf0c7d542f120db8e7e9cd72d22', provider);
    const borrower = '0x1Cf0b26c63817Bfd467630D247A32529091fde49';
    const borrowerSigner = new hre.ethers.Wallet("0x0662c9d03d341b1d16fb7f0f9fc7e1e6194c4c57ec338c0011f0b875c3279c45", provider);
    const liquidator = "0x3be0dDA9B3657B63c2cd9e836E41903c97518088";
    const liquidatorSigner = new hre.ethers.Wallet("0xf872848c823a83e3e74f040cd9a7ee4b9099d863e2b59b2ac3e3ec73fb831ba0", provider);

    // Tokens
    const rinkWETH = "0xd74047010D77c5901df5b0f9ca518aED56C85e8D";
    const rinkUSDC = "0xb18d016cDD2d9439A19f15633005A6b2cd6Aa774";
    const USDCTokenContract = await hre.ethers.getContractAt(erc20, rinkUSDC);
    const WETHTokenContract = await hre.ethers.getContractAt(erc20, rinkWETH);

    // Get pool
    const poolAddr = await IPoolAddressProvider.getPool();
    const poolContract = await hre.ethers.getContractAt(poolABI, poolAddr)

    //approve protocol to access depositor wallet
    const approveData = await USDCTokenContract.connect(depositorSigner).approve("0x87530ED4bd0ee0e79661D65f8Dd37538F693afD5", '1000000000000000000000000000000000');
    const approveData2 = await USDCTokenContract.connect(depositorSigner).approve(poolAddr, '1000000000000000000000000000000000');

    // Mint USDC to depositor
    const mint = await USDCTokenContract.connect(depositorSigner).mint(depositor, 90000000000);
    mint.wait();

    //Depositor deposits 6000 USDC
    const depositorDeposit = await poolContract.connect(depositorSigner).supply(rinkUSDC, 60000000000, depositor, '0');
    depositorDeposit.wait();

    //borrower deposits 0.002 WETH
    const approveData3 = await WETHTokenContract.connect(borrowerSigner).approve("0x87530ED4bd0ee0e79661D65f8Dd37538F693afD5", '10000000000000000000000000');
    approveData3.wait();
    const approveData4 = await WETHTokenContract.connect(borrowerSigner).approve(poolAddr, '10000000000000000000000000');
    approveData4.wait();

    // Mint WETH to borrower
    const mint2 = await WETHTokenContract.connect(borrowerSigner).mint(borrower, 9000000000000000)
    mint2.wait();

    // Borrower deposits WETH
    const borrowerDeposit = await poolContract.connect(borrowerSigner).supply(rinkWETH, 2000000000000000, borrower, '0');
    borrowerDeposit.wait()

    // Get global data of Borrower
    const userGlobalData = await poolContract.getUserAccountData(borrower);

    // Set up oracle
    const oracleAddr = "0xA323726989db5708B19EAd4A494dDe09F3cEcc69"
    const oracleContract = await hre.ethers.getContractAt(oracleABI, oracleAddr);

    // Get amount of USDC to borrow
    const usdcPrice = await oracleContract.getAssetPrice(USDCTokenContract.address);
    const toMul = userGlobalData.availableBorrowsBase.div(usdcPrice.toString()).toNumber()
    const result = (toMul * 0.9502)
    const rounded = Math.round(result).toString()
    const usdcToBorrow = convertToCurrencyDecimals(rounded, 6);
    console.log(usdcToBorrow)
    // Borrower makes the borrow
    const borrowerBorrow = await poolContract.connect(borrowerSigner).borrow(USDCTokenContract.address, usdcToBorrow, 1, "0", borrower);
    borrowerBorrow.wait()

    // Get global data of Borrower
    const userGlobalData2 = await poolContract.getUserAccountData(borrower);
    console.log(userGlobalData2.healthFactor)

    // Drop HF below 1 by setting usdc Price
    const toSet = hre.ethers.BigNumber.from(Math.round(usdcPrice.toNumber() * 1.12).toString())
    // await oracleContract.setAssetPrice(
    //   USDCTokenContract.address,
    //   toSet
    // );

    // const borrowerBorrowLiq = await poolContract.connect(borrowerSigner).borrow(USDCTokenContract.address, usdcToBorrow, 1, "0", borrower);
    // borrowerBorrowLiq.wait()
    // console.log(borrowerBorrowLiq)

    // Get global data of Borrower
    const userGlobalData3 = await poolContract.getUserAccountData(borrower);
    console.log(userGlobalData3.healthFactor)

    // Mint USDC to liquidator
    await USDCTokenContract
      .connect(liquidatorSigner)
      .mint(liquidator, convertToCurrencyDecimals('10000', 6));

    // Approve protocol to access liquidator wallet 
   const approveLiquidatorAccess = await USDCTokenContract.connect(liquidatorSigner).approve(poolAddr, '10000000000000000000000000');
   approveLiquidatorAccess.wait();

   // Set up Helper Contract
    const helpersAddr = "0xBAB2E7afF5acea53a43aEeBa2BA6298D8056DcE5"
    const helpersContract = await hre.ethers.getContractAt(helpersABI, helpersAddr);

    // Get reserve data of borrower before liquidation
    const userReserveDataBefore = await helpersContract.getUserReserveData(
      USDCTokenContract.address,
      borrower
    );
    const usdcReserveDataBefore = await helpersContract.getReserveData(USDCTokenContract.address);
    //console.log("USDC Resever Data")
    //console.log(usdcReserveDataBefore)

    const ethReserveDataBefore = await helpersContract.getReserveData(WETHTokenContract.address);
    //console.log("ETH Reserve Data")
    //console.log(ethReserveDataBefore)
    
    // Get the amount to liquidate
    const amountToLiquidate = hre.ethers.BigNumber.from(
      userReserveDataBefore.currentStableDebt.toString()
    )
      .div(2)
      .toString();
    
    // Mint contract USDC and weth for initial flashloan test
    await USDCTokenContract
      .mint(aaveSearcher.address, convertToCurrencyDecimals('10000', 6));
    
    await WETHTokenContract
      .mint(aaveSearcher.address, convertToCurrencyDecimals('4', 18));
    
    // const liq = await aaveSearcher.connect(liquidatorSigner).liquidateLoan(rinkWETH, rinkUSDC, borrower, amountToLiquidate)
    // console.log(liq)
    // Executes flashloan
    // await wethTokenContract.approve(aaveSearcher.address, 200000000000000)
    // const loan = await aaveSearcher.execFlashLoan(USDCTokenContract.address, amountToLiquidate, WETHTokenContract.address, borrower, 0, 3000);
    // console.log(loan)
  }
  
  // We recommend this pattern to be able to use async/await everywhere
  // and properly handle errors.
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });

