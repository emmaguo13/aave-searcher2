# Aave Liquidator

This project liquidates unhealthy borrows using flash loans.
The test case in `./scripts/final-flashloan.js` creates a borrowing position, drops it's Health Factor below one, and allows the liquidator to call the flashloan contract to liquidate the unhealthy loan.

Here's how to start the project.

```shell
npm i
npx hardhat run ./scripts/final-flashloan.js --network hardhat
```
