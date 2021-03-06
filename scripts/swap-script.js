const hre = require("hardhat");
const { getContractAddress } = require('@ethersproject/address')
const erc20 = require("../utils/erc20mintable.json")
//import fetch from "node-fetch";

function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

const convertToCurrencyDecimals = async (amount, decimals) => {
    return hre.ethers.utils.parseUnits(amount, decimals);
  };


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
    const swapRouter02 = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45";
    // Get PoolAddressProvider
    const poolAddressProviderAddr = '0xBA6378f1c1D046e9EB0F538560BA7558546edF3C';
    const aaveSearcher = await AaveSearcher.deploy(poolAddressProviderAddr, swapRouter02);
    await aaveSearcher.deployed();

    const liquidator = "0x3be0dDA9B3657B63c2cd9e836E41903c97518088";
    await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [liquidator],
      });
    const liquidatorSigner = await ethers.getSigner(liquidator)

    // console.log("Aave Searcher deployed to:", aaveSearcher.address);
    //const aaveSearcher = await hre.ethers.getContractAt("AaveSearcher", "0x631DF5EaCFAa0bceC11D27c082c0fFb3e65B1366");
    // SWAP WETH TO DAI
    // const rinkWETH = "0xc778417E063141139Fce010982780140Aa0cD5Ab";
    // const rinkUSDC = "0x4DBCdF9B62e891a7cec5A2568C3F4FAF9E8Abe2b";
    const rinkWETH = "0xd74047010D77c5901df5b0f9ca518aED56C85e8D";
    const rinkUSDC = "0xb18d016cDD2d9439A19f15633005A6b2cd6Aa774";
    //console.log(aaveSearcher)

    //fetch("https://api.etherscan.io/api?module=contract&action=getabi&address="+ aaveSearcher.address + "&apikey=RNNCQEBWY52XXJ9QAMP7JBT7CG98R5ZXAM").then(data => {
    //  console.log(data.result)
    //})

    // const goerliWETH = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6";
    // const goerliUSDC = "0xD87Ba7A50B2E7E660f678A895E4B72E7CB4CCd9C";

    const erc20ABI = [
      {
          "constant": true,
          "inputs": [],
          "name": "name",
          "outputs": [
              {
                  "name": "",
                  "type": "string"
              }
          ],
          "payable": false,
          "stateMutability": "view",
          "type": "function"
      },
      {
          "constant": false,
          "inputs": [
              {
                  "name": "_spender",
                  "type": "address"
              },
              {
                  "name": "_value",
                  "type": "uint256"
              }
          ],
          "name": "approve",
          "outputs": [
              {
                  "name": "",
                  "type": "bool"
              }
          ],
          "payable": false,
          "stateMutability": "nonpayable",
          "type": "function"
      },
      {
          "constant": true,
          "inputs": [],
          "name": "totalSupply",
          "outputs": [
              {
                  "name": "",
                  "type": "uint256"
              }
          ],
          "payable": false,
          "stateMutability": "view",
          "type": "function"
      },
      {
          "constant": false,
          "inputs": [
              {
                  "name": "_from",
                  "type": "address"
              },
              {
                  "name": "_to",
                  "type": "address"
              },
              {
                  "name": "_value",
                  "type": "uint256"
              }
          ],
          "name": "transferFrom",
          "outputs": [
              {
                  "name": "",
                  "type": "bool"
              }
          ],
          "payable": false,
          "stateMutability": "nonpayable",
          "type": "function"
      },
      {
          "constant": true,
          "inputs": [],
          "name": "decimals",
          "outputs": [
              {
                  "name": "",
                  "type": "uint8"
              }
          ],
          "payable": false,
          "stateMutability": "view",
          "type": "function"
      },
      {
          "constant": true,
          "inputs": [
              {
                  "name": "_owner",
                  "type": "address"
              }
          ],
          "name": "balanceOf",
          "outputs": [
              {
                  "name": "balance",
                  "type": "uint256"
              }
          ],
          "payable": false,
          "stateMutability": "view",
          "type": "function"
      },
      {
          "constant": true,
          "inputs": [],
          "name": "symbol",
          "outputs": [
              {
                  "name": "",
                  "type": "string"
              }
          ],
          "payable": false,
          "stateMutability": "view",
          "type": "function"
      },
      {
          "constant": false,
          "inputs": [
              {
                  "name": "_to",
                  "type": "address"
              },
              {
                  "name": "_value",
                  "type": "uint256"
              }
          ],
          "name": "transfer",
          "outputs": [
              {
                  "name": "",
                  "type": "bool"
              }
          ],
          "payable": false,
          "stateMutability": "nonpayable",
          "type": "function"
      },
      {
          "constant": true,
          "inputs": [
              {
                  "name": "_owner",
                  "type": "address"
              },
              {
                  "name": "_spender",
                  "type": "address"
              }
          ],
          "name": "allowance",
          "outputs": [
              {
                  "name": "",
                  "type": "uint256"
              }
          ],
          "payable": false,
          "stateMutability": "view",
          "type": "function"
      },
      {
          "payable": true,
          "stateMutability": "payable",
          "type": "fallback"
      },
      {
          "anonymous": false,
          "inputs": [
              {
                  "indexed": true,
                  "name": "owner",
                  "type": "address"
              },
              {
                  "indexed": true,
                  "name": "spender",
                  "type": "address"
              },
              {
                  "indexed": false,
                  "name": "value",
                  "type": "uint256"
              }
          ],
          "name": "Approval",
          "type": "event"
      },
      {
          "anonymous": false,
          "inputs": [
              {
                  "indexed": true,
                  "name": "from",
                  "type": "address"
              },
              {
                  "indexed": true,
                  "name": "to",
                  "type": "address"
              },
              {
                  "indexed": false,
                  "name": "value",
                  "type": "uint256"
              }
          ],
          "name": "Transfer",
          "type": "event"
      }
  ]

    const wethTokenContract = await hre.ethers.getContractAt(erc20ABI, rinkWETH)
    //console.log(wethTokenContract)
    const approveData = await wethTokenContract.connect(liquidatorSigner).approve(aaveSearcher.address, 200000000000000)
    console.log(approveData)

    sleep(30000);

    //const check = await aaveSearcher.hi()
    //console.log(check)

    // await wethTokenContract.connect(liquidatorSigner)
    //   .mint(liquidator, convertToCurrencyDecimals('10', 18));

    const res = await aaveSearcher.connect(liquidatorSigner).swapExactInputSingle(100000000000000, 0, rinkWETH, rinkUSDC, 3000);
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
