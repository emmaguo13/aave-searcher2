const hre = require("hardhat");
const secret = require("../secret");

const erc20 = require("../utils/erc20mintable.json");
const poolABI = require("../utils/pool.json");
const oracleABI = require("../utils/oracle.json");
const factoryABI = require("../utils/factory.json");
const helpersABI = require("../utils/helper.json");
const nftABI = require("../utils/nft.json");

const poolAddressProviderABI = require("../utils/poolAddressProv.json");
const { ethers } = require("hardhat");

const chai = require("chai");
const { expect } = chai;
chai.use(require("chai-bignumber")(hre.ethers.BigNumber));

const convertToCurrencyDecimals = async (amount, decimals) => {
  return hre.ethers.utils.parseUnits(amount, decimals);
};

async function main() {
  // We get the contract to deploy
  const AaveSearcher = await hre.ethers.getContractFactory("AaveSearcher");
  const swapRouter02 = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45";

  // Get PoolAddressProvider
  const poolAddressProviderAddr = "0xBA6378f1c1D046e9EB0F538560BA7558546edF3C";
  const IPoolAddressProvider = await hre.ethers.getContractAt(
    poolAddressProviderABI,
    poolAddressProviderAddr
  );

  const aaveSearcher = await AaveSearcher.deploy(
    IPoolAddressProvider.address,
    swapRouter02
  );
  await aaveSearcher.deployed();

  // Accounts
  const depositor = "0x53607A7DDFb72893579AC2aA18D62d586244a6C2";
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [depositor],
  });
  const depositorSigner = await ethers.getSigner(depositor);

  const borrower = "0x1Cf0b26c63817Bfd467630D247A32529091fde49";
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [borrower],
  });
  const borrowerSigner = await ethers.getSigner(borrower);

  const liquidator = "0x3be0dDA9B3657B63c2cd9e836E41903c97518088";
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [liquidator],
  });
  const liquidatorSigner = await ethers.getSigner(liquidator);

  const poolAdmin = "0x77c45699A715A64A7a7796d5CEe884cf617D5254";
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [poolAdmin],
  });
  const poolAdminSigner = await ethers.getSigner(poolAdmin);

  // Tokens
  const rinkWETH = "0xd74047010D77c5901df5b0f9ca518aED56C85e8D";
  const rinkUSDC = "0xb18d016cDD2d9439A19f15633005A6b2cd6Aa774";
  const USDCTokenContract = await hre.ethers.getContractAt(erc20, rinkUSDC);
  const WETHTokenContract = await hre.ethers.getContractAt(erc20, rinkWETH);

  // Get pool
  const poolAddr = await IPoolAddressProvider.getPool();
  const poolContract = await hre.ethers.getContractAt(poolABI, poolAddr);

  //approve protocol to access depositor wallet
  const actualPoolAddr = "0x87530ED4bd0ee0e79661D65f8Dd37538F693afD5";
  const approveDep1 = await USDCTokenContract.connect(depositorSigner).approve(
    actualPoolAddr,
    "1000000000000000000000000000000000"
  );
  approveDep1.wait();
  const approveDep2 = await USDCTokenContract.connect(depositorSigner).approve(
    poolAddr,
    "1000000000000000000000000000000000"
  );
  approveDep2.wait();

  // Mint USDC to depositor
  const mintDep = await USDCTokenContract.connect(depositorSigner).mint(
    depositor,
    900000000
  );
  mintDep.wait();

  //Depositor deposits 6000 USDC
  const depositorDeposit = await poolContract
    .connect(depositorSigner)
    .supply(rinkUSDC, 60000000000, depositor, "0");
  depositorDeposit.wait();

  // approve borrower
  const approveData1 = await WETHTokenContract.connect(borrowerSigner).approve(
    actualPoolAddr,
    "10000000000000000000000000"
  );
  approveData1.wait();
  const approveData2 = await WETHTokenContract.connect(borrowerSigner).approve(
    poolAddr,
    "10000000000000000000000000"
  );
  approveData2.wait();

  // Mint WETH to borrower
  const mint = await WETHTokenContract.connect(borrowerSigner).mint(
    borrower,
    9000000000000000
  );
  mint.wait();

  // Borrower deposits 0.000002 WETH
  const borrowerDeposit = await poolContract
    .connect(borrowerSigner)
    .supply(rinkWETH, 2000000000000, borrower, "0");
  borrowerDeposit.wait();

  // Get global data of Borrower
  const userGlobalData = await poolContract.getUserAccountData(borrower);

  // Set up old oracle
  const oracleAddr = "0xA323726989db5708B19EAd4A494dDe09F3cEcc69";
  const oracleContract = await hre.ethers.getContractAt(oracleABI, oracleAddr);

  // Get amount of USDC to borrow
  const usdcPrice = await oracleContract.getAssetPrice(
    USDCTokenContract.address
  );
  const toMul = userGlobalData.availableBorrowsBase
    .div(usdcPrice.toString())
    .toNumber();
  const result = toMul * 0.9502;
  const rounded = Math.round(result).toString();
  const usdcToBorrow = convertToCurrencyDecimals(rounded, 6);
  // Borrower makes the borrow
  const borrowerBorrow = await poolContract
    .connect(borrowerSigner)
    .borrow(USDCTokenContract.address, usdcToBorrow, 1, "0", borrower);
  borrowerBorrow.wait();

  // GET BEFORE PRICE ORACLE
  const beforeOracle = await IPoolAddressProvider.getPriceOracle();

  // Deploy new aave oracle
  const AaveOracle = await hre.ethers.getContractFactory("AaveOracle");

  const sourceWETH = await oracleContract.getSourceOfAsset(rinkWETH);
  const sourceUSDC = await oracleContract.getSourceOfAsset(rinkUSDC);
  const fallback = "0x0000000000000000000000000000000000000000";
  const baseCurr = "0x0000000000000000000000000000000000000000";

  const aaveOracle = await AaveOracle.deploy(
    poolAddressProviderAddr,
    [rinkWETH, rinkUSDC],
    [sourceWETH, sourceUSDC],
    fallback,
    baseCurr,
    100000000
  );
  aaveOracle.deployed();

  // Set pool address to new aave oracle
  const poolAddrOwner = "0x77c45699A715A64A7a7796d5CEe884cf617D5254";
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [poolAddrOwner],
  });
  const poolOwnerSigner = await ethers.getSigner(poolAddrOwner);
  await IPoolAddressProvider.connect(poolOwnerSigner).setPriceOracle(
    aaveOracle.address
  );

  // Drop HF below 1 by setting usdc Price
  const toSet = hre.ethers.BigNumber.from(
    Math.round(usdcPrice.toNumber() * 5).toString()
  );
  await aaveOracle
    .connect(poolAdminSigner)
    .setAssetPrice(USDCTokenContract.address, toSet);

  // GET AFTER PRICE ORACLE
  const afterOracle = await IPoolAddressProvider.getPriceOracle();

  // Mint USDC to liquidator
  await USDCTokenContract.connect(liquidatorSigner).mint(
    liquidator,
    convertToCurrencyDecimals("10000", 6)
  );

  // Approve protocol to access liquidator wallet
  const approveLiquidatorAccess = await USDCTokenContract.connect(
    liquidatorSigner
  ).approve(poolAddr, "10000000000000000000000000");
  approveLiquidatorAccess.wait();

  // Set up Helper Contract
  const helpersAddr = "0xBAB2E7afF5acea53a43aEeBa2BA6298D8056DcE5";
  const helpersContract = await hre.ethers.getContractAt(
    helpersABI,
    helpersAddr
  );

  // Get reserve data of borrower before liquidation
  const userReserveDataBefore = await helpersContract.getUserReserveData(
    USDCTokenContract.address,
    borrower
  );
  const usdcReserveDataBefore = await helpersContract.getReserveData(
    USDCTokenContract.address
  );

  const ethReserveDataBefore = await helpersContract.getReserveData(
    WETHTokenContract.address
  );

  // Get close factor
  const CLOSE_FACTOR_THRESH = 0.95 * 10 ** 18;
  let close_factor = 0.5;

  const userGlobalDataLowHF = await poolContract.getUserAccountData(borrower);
  if (
    userGlobalDataLowHF.healthFactor.lt(
      hre.ethers.BigNumber.from(CLOSE_FACTOR_THRESH.toString())
    )
  ) {
    close_factor = 1;
  }

  // Debt to cover
  const amountToLiquidate = hre.ethers.BigNumber.from(
    userReserveDataBefore.currentStableDebt.toString()
  )
    .mul(close_factor)
    .toString();

  // Gas Estimation
  const gasUnits = await aaveSearcher.estimateGas.execFlashLoan(
    USDCTokenContract.address,
    amountToLiquidate,
    WETHTokenContract.address,
    borrower,
    0,
    10000,
    liquidator
  );
  const gasPrice = await hre.ethers.provider.getGasPrice();
  const gas = gasUnits.mul(gasPrice);

  // Calculate profitability
  const USDCAlteredPrice = await aaveOracle.getAssetPrice(
    USDCTokenContract.address
  );
  const configData = await helpersContract.getReserveConfigurationData(
    WETHTokenContract.address
  );
  const maxAmountOfCollateralToLiquidate = USDCAlteredPrice.mul(
    amountToLiquidate
  ).mul(configData.liquidationBonus);

  const predictedProfit = maxAmountOfCollateralToLiquidate
    .mul(configData.liquidationBonus.sub(hre.ethers.BigNumber.from(10 ** 4)))
    .sub(gas);
  if (predictedProfit < 0) {
    console.log("No profit to be made off of liquidation.");
    return;
  }

  // Mint contract USDC for initial flashloan test
  await USDCTokenContract.mint(
    aaveSearcher.address,
    convertToCurrencyDecimals("1000000", 6)
  );

  // Mint liquidator WETH to test swap
  await WETHTokenContract.connect(liquidatorSigner).mint(
    liquidator,
    convertToCurrencyDecimals("10", 18)
  );

  // FIND POOL
  const factoryAddr = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
  const factoryContract = await hre.ethers.getContractAt(
    factoryABI,
    factoryAddr
  );
  const pool = await factoryContract.getPool(rinkWETH, rinkUSDC, 10000);

  // check if the user has the uniswap nft
  const nftAddr = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";
  const nftContract = await hre.ethers.getContractAt(nftABI, nftAddr);
  const hasNft = await nftContract.balanceOf(borrower);

  // Executes flashloan
  const loan = await aaveSearcher
    .connect(liquidatorSigner)
    .execFlashLoan(
      USDCTokenContract.address,
      amountToLiquidate,
      WETHTokenContract.address,
      borrower,
      0,
      10000,
      liquidator
    );
  console.log(loan);

  let receipt = await loan.wait();
  let event = receipt.events?.filter((x) => {
    return x.event == "Profit";
  });
  let profit = event[0].args;
  console.log(profit[0]);

  const userReserveDataAfter = await helpersContract.getUserReserveData(
    USDCTokenContract.address,
    borrower
  );

  const userGlobalDataAfter = await poolContract.getUserAccountData(borrower);

  const usdcReserveDataAfter = await helpersContract.getReserveData(
    USDCTokenContract.address
  );
  const ethReserveDataAfter = await helpersContract.getReserveData(
    WETHTokenContract.address
  );

  const collateralPrice = await aaveOracle.getAssetPrice(
    WETHTokenContract.address
  );
  const principalPrice = await aaveOracle.getAssetPrice(
    USDCTokenContract.address
  );

  const collateralDecimals = (
    await helpersContract.getReserveConfigurationData(WETHTokenContract.address)
  ).decimals.toString();
  const principalDecimals = (
    await helpersContract.getReserveConfigurationData(USDCTokenContract.address)
  ).decimals.toString();

  const expectedCollateralLiquidated = new hre.ethers.BigNumber.from(
    principalPrice.toString()
  )
    .mul(new hre.ethers.BigNumber.from(amountToLiquidate).mul(105))
    .mul(new hre.ethers.BigNumber.from(10).pow(collateralDecimals))
    .div(
      new hre.ethers.BigNumber.from(collateralPrice.toString()).mul(
        new hre.ethers.BigNumber.from(10).pow(principalDecimals)
      )
    )
    .div(100);

  // Final swap
  await USDCTokenContract.connect(liquidatorSigner).approve(
    aaveSearcher.address,
    200000000000000
  );
  const res = await aaveSearcher
    .connect(liquidatorSigner)
    .swapExactInputSingle(profit[0], 0, rinkUSDC, rinkWETH, 10000);
  console.log(res);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
