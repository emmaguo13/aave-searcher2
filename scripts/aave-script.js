const hre = require("hardhat");
const { getContractAddress } = require('@ethersproject/address')

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
    const AaveSearcher = await hre.ethers.getContractFactory("AaveSearcher");
    //const swapRouter02 = hre.ethers.utils.getAddress("0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45");
    // const swapRouter02 = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45";
    // const aaveSearcher = await AaveSearcher.deploy(swapRouter02);
    // await aaveSearcher.deployed();

    // console.log("Aave Searcher deployed to:", aaveSearcher.address);
    const aaveSearcher = await hre.ethers.getContractAt("AaveSearcher", "0x631DF5EaCFAa0bceC11D27c082c0fFb3e65B1366");
    // SWAP WETH TO DAI
    //const rinkWETH = ethers.utils.getAddress("0xc778417E063141139Fce010982780140Aa0cD5Ab");
    //const rinkDAI = ethers.utils.getAddress("0x95b58a6Bff3D14B7DB2f5cb5F0Ad413DC2940658");

    const goerliWETH = "0x48B8E7D9EA9Ba97472E02a38EF3B708D78350D88";
    const goerliDAI = "0x73967c6a0904aA032C103b4104747E88c566B1A2";

    const res = await aaveSearcher.swapExactInputSingle(ethers.FixedNumber.fromString("0.1", "fixed128x18"), 210, goerliWETH, goerliDAI, 3000);
    console.log(res)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
