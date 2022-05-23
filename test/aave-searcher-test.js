// const { expect } = require("chai");
// const { ethers } = require("hardhat");
// const { getContractAddress } = require('@ethersproject/address')

// describe("Swap from collateral asset to borrowed asset", function () {
//   it("Should return the borrowed asset",async (done) => {

//     const [owner] = await ethers.getSigners()

//     const transactionCount = await owner.getTransactionCount()

//     const futureAddress = getContractAddress({
//       from: owner.address,
//       nonce: transactionCount
//     })

//     console.log(futureAddress);

//     //console.log("Account balance:", (await deployer.getBalance()).toString());

//     const AaveSearcher = await ethers.getContractFactory("AaveSearcher");
//     //const swapRouter02 = ethers.utils.getAddress("0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45");
//     const swapRouter02 = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45";
//     const aaveSearcher = await AaveSearcher.deploy(swapRouter02);
//     await aaveSearcher.deployed();

//     //SWAP ETH TO DAI

//     const rinkWETH = "0xc778417E063141139Fce010982780140Aa0cD5Ab";
//     const rinkDAI = "0x95b58a6Bff3D14B7DB2f5cb5F0Ad413DC2940658";
//     aaveSearcher.swapExactInputSingle(ethers.FixedNumber.fromString("0.1", "fixed128x18"), 210, rinkWETH, rinkDAI, 3000).then((res, body) => {
//       expect(res).equal(210);
//       done();
//   }).catch(done);

//     // const setGreetingTx = await greeter.setGreeting("Hola, mundo!");

//     // // wait until the transaction is mined
//     // await setGreetingTx.wait();

//     // expect(await greeter.greet()).to.equal("Hola, mundo!");
//   })//.timeout(420000)
// });