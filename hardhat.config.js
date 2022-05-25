require("@nomiclabs/hardhat-waffle");
let secret = require("./secret");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
//  module.exports = {
//   networks: {
//     rinkeby: {
//       url: secret.url,
//       accounts: [secret.key]
//       // gas: 2100000,
//       // gasPrice: 800000000
//     },
//     goerli: {
//       url: secret.goerli,
//       accounts: [secret.key]
//     }
//   },
//   solidity: {
//     compilers: [
//       {
//         version: "0.8.10",
//       },
//       {
//         version: "0.6.7",
//         settings: {},
//       },
//       {
//         version: "0.7.1",
//         settings: {},
//       },
//     ],
//   },
//   // mocha: {
//   //   timeout: 20000
//   // }
// };

module.exports = {
  solidity: "0.8.10",
  networks: {
    rinkeby: {
      url: secret.rinkeby,
      accounts: [secret.key]
    },
    goerli: {
      url: secret.goerli,
      accounts: [secret.key],
      gas: 2100000,
      gasPrice: 8000000000
    }
  }
}