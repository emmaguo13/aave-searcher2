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
    const swapRouter02 = hre.ethers.utils.getAddress("0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45");
    const aaveSearcher = await AaveSearcher.deploy(swapRouter02);
    await aaveSearcher.deployed();

//     const contractAddress = "0x...",
// const myContract = await hre.ethers.getContractAt("MyContract", contractAddress);

  console.log("Aave Searcher deployed to:", aaveSearcher.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
