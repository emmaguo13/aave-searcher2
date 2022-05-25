// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.10;


import '@aave/core-v3/contracts/flashloan/base/FlashLoanSimpleReceiverBase.sol';
import '@aave/core-v3/contracts/interfaces/IPool.sol';
import '@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol';
import '@openzeppelin/contracts/interfaces/IERC20.sol';
import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';
import "@uniswap/swap-router-contracts/contracts/interfaces/IV3SwapRouter.sol";
import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';
import "hardhat/console.sol";

contract AaveSearcher is FlashLoanSimpleReceiverBase {
//contract AaveSearcher {

    // i can get rid of this stuff

    // IPoolAddressesProvider provider = LendingPoolAddressesProvider(address(0x24a42fD28C976A61Df5D00D0599C34c4f90748c8)); 
    // IPool pool = LendingPool(provider.getLendingPool());

    IV3SwapRouter public immutable swapRouter;
    address public immutable swapRouterAddr;

    constructor(IPoolAddressesProvider _poolProvider, address _swapRouterAddr) FlashLoanSimpleReceiverBase(_poolProvider) public {
        swapRouterAddr = _swapRouterAddr;
        swapRouter = IV3SwapRouter(_swapRouterAddr);
        console.log("Deploying an AaveSearcher with Swap Router Addr:", _swapRouterAddr);
    }

    function liquidateLoan(
        address collateral,
        address asset,
        address userToLiq,
        uint256 amount
    ) external {
        IERC20(asset).approve(address(POOL), amount);
        POOL.liquidationCall(collateral, asset, userToLiq, amount, false);

        //function liquidationCall(address _collateral, address _reserve, address _user, uint256 _purchaseAmount, bool _receiveaToken)

    }

    // function execFlashLoan(
    //     address _asset,
    //     uint256 _amount,
    //     address _collateral,
    //     address _liqedUser,
    //     uint256 _amtOutMin, // for swap
    //     uint24 _poolFee // for swap
    // ) {
    //     /* Call pool contract, req flash loan of certain amount, certain reserve */
    //     // use simple flash loan for gas efficiency
    //     // TODO: ACTUALLY I SHOULD NOT USE FLASH LOAN SIMPLE
    //     address receiverAddress = address(this);
    //     address asset = _asset;
    //     // the parameters 
    //     bytes memory params = abi.encode(_collateral, _liqedUser, _amtOutMin, _poolFee);
    //     uint256 amount = _amount;
    //     // referralCode, last arg, is a uint16
    //     POOL.flashLoanSimple(receiverAddress, asset, amount, params, 0);
    // }

    /* 
        Called after contract receives flash loaned amont 
    */
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes memory params
    )
        external
        override
        returns (bool)
    {
        // TODO: 1. where do we get premium, what is premium? percentage or number according to loan?
        // still dk where we actually pass in premium
        // Answer: premium is actuall the FEE of the FLASHLOANED asset, so we have to pay this back too lamooam

        // (address collateral, address toLiq, uint256 amtOutMin, uint24 poolFee) = abi.decode(params, (address, address, uint256, uint24));

        // /* Do liquidation for the loan */
        // // TODO: make sure this function is correct somewhere
        // liquidateLoan(collateral, asset, toLiq, amount);

        // /* Swap profit from collateral back to the token used for flashloan */
        // // You're repaying in the borrowed asset ? YES, you're repaying half of the value of the borrowed asset
        // // TODO: make sure you know how to do the swap yourself. and understand amtOutMin, is this standardized for Aave?
        // //swapToLoanAsset(collateral,asset,amtOutMin, path);
        // swapExactInputSingle(IERC20(collateral).balanceOf(address(this)), amtOutMin, collateral, asset, poolFee);

        //  /* Calculate profitability of liq, considering gas, premium of flash loan */
        // //bool shouldLiq = shouldLiquidate(IERC20(asset).balanceOf(address(this)), amount, premium, prevBal);

        // uint256 bonus = userCollateralBal - amount - premium;
        // // TODO: not sure if the false is correct?
        // if (bonus <= 0) {
        //     return false;
        // }

        // /* Pay profit to user */
        // //uint256 prevBal = IERC20(collateral).balanceOf(address(this));
        // IERC20(collateral).transfer(owner(), bonus);

        // /* Approve pool for flash loan, make sure we have enough to pay back amount borrowed + premium, or else we revert */
        // // TODO: check erc20 stuff
        // uint256 owe = amount.add(premium);
        // IERC20(asset).approve(address(POOL), owe);

        return true;
    }

    // function shouldLiquidate(
    //     uint256 userCollateralBal,
    //     uint256 amount,
    //     uint256 premium
    // ) 
    //     external
    //     returns (uint256)
    // {
    //     /* Get address price using Aave oracle contract and getAssetPrice() */
    //     //uint256 collateralAssetPriceEth = 

    //     // a. The maximum collateral bonus received on liquidation is given by the maxAmountOfCollateralToLiquidate * (1 - liquidationBonus) * collateralAssetPriceEth
    //     // get liq bonus 
    //     uint256 bonus = userCollateralBal - amount - premium;
    //     return bonus;
    //     // b. max cost of txn will be gas price x amt of gas used, used estimateGas via web3 provider
    //     // profit will be collateral bonus - cost of txn (a - b)

    // }

    // function swapToEth(

    // ) {

    // }

    function hi() external returns (uint256 amountOut) {
        return 1;
    }

    /// @notice swapExactInputSingle swaps a fixed amount of DAI for a maximum possible amount of WETH9
    /// using the DAI/WETH9 0.3% pool by calling `exactInputSingle` in the swap router.
    /// @dev The calling address must approve this contract to spend at least `amountIn` worth of its DAI for this function to succeed.
    /// @param amountIn The exact amount of DAI that will be swapped for WETH9.
    /// @return amountOut The amount of WETH9 received.
    // swapExactInputSingle(uint256 amountIn, uint256 amountOutMin, address tokenIn, address tokenOut, uint24 poolFee) external returns (uint256 amountOut)
    function swapExactInputSingle(uint256 amountIn, uint256 amountOutMin, address tokenIn, address tokenOut, uint24 poolFee) external returns (uint256 amountOut) {
        //msg.sender must approve this contract

        //Transfer the specified amount of DAI to this contract.
        TransferHelper.safeTransferFrom(tokenIn, msg.sender, address(this), amountIn);

        // Approve the router to spend DAI.
        TransferHelper.safeApprove(tokenIn, address(swapRouter), amountIn);

        // Naively set amountOutMinimum to 0. In production, use an oracle or other data source to choose a safer value for amountOutMinimum.
        // We also set the sqrtPriceLimitx96 to be 0 to ensure we swap our exact input amount.
        IV3SwapRouter.ExactInputSingleParams memory params =
            IV3SwapRouter.ExactInputSingleParams({
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                fee: poolFee,
                recipient: msg.sender,
                //deadline: block.timestamp + 200,
                amountIn: amountIn,
                amountOutMinimum: amountOutMin,
                sqrtPriceLimitX96: 0
            });


        // The call to `exactInputSingle` executes the swap.
        amountOut = swapRouter.exactInputSingle(params);
    
    }


}
