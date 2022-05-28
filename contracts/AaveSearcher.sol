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

    IV3SwapRouter public immutable swapRouter;
    address public immutable swapRouterAddr;
    
    event Profit(uint _profit);

    constructor(IPoolAddressesProvider _poolProvider, address _swapRouterAddr) FlashLoanSimpleReceiverBase(_poolProvider) public {
        swapRouterAddr = _swapRouterAddr;
        swapRouter = IV3SwapRouter(_swapRouterAddr);
        console.log("Deploying an AaveSearcher with Swap Router Addr:", _swapRouterAddr);
    }

    function swapExactInputSingle(uint256 amountIn, uint256 amountOutMin, address tokenIn, address tokenOut, uint24 poolFee) external returns (uint256 amountOut) {
        //Transfer the specified amount of DAI to this contract.
        TransferHelper.safeTransferFrom(tokenIn, msg.sender, address(this), amountIn);

        // Approve the router to spend DAI.
        TransferHelper.safeApprove(tokenIn, address(swapRouter), amountIn);

        IV3SwapRouter.ExactInputSingleParams memory params =
            IV3SwapRouter.ExactInputSingleParams({
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                fee: poolFee,
                recipient: msg.sender,
                amountIn: amountIn,
                amountOutMinimum: amountOutMin,
                sqrtPriceLimitX96: 0
            });


        // The call to `exactInputSingle` executes the swap.
        amountOut = swapRouter.exactInputSingle(params);
    
    }

    function liquidateLoan(
        address collateral,
        address asset,
        address userToLiq,
        uint256 amount
    ) external {
        IERC20(asset).approve(address(POOL), amount);
        POOL.liquidationCall(collateral, asset, userToLiq, amount, false);
    }

    function execFlashLoan(
        address _asset,
        uint256 _amount,
        address _collateral,
        address _liqedUser,
        uint256 _amtOutMin,
        uint24 _poolFee, 
        address _liquidator
    ) external {
        /* Call pool contract, req flash loan of certain amount, certain reserve */
        // use simple flash loan for gas efficiency
        address receiverAddress = address(this);

        bytes memory params = abi.encode(_collateral, _liqedUser, _amtOutMin, _poolFee, _liquidator);
        POOL.flashLoanSimple(receiverAddress, _asset, _amount, params, 0);
    }

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
        
        (address collateral, address toLiq, uint256 amtOutMin, uint24 poolFee, address liquidator) = abi.decode(params, (address, address, uint256, uint24, address));

        /* Do liquidation for the loan */
        this.liquidateLoan(collateral, asset, toLiq, amount);

        /* Swap profit from collateral back to the token used for flashloan */
        this.swapExactInputSingle(IERC20(collateral).balanceOf(address(this)), amtOutMin, collateral, asset, poolFee);

         /* Calculate profitability of liq, considering gas, premium of flash loan */
        uint256 bonus = IERC20(asset).balanceOf(address(this)) - amount - premium;

        // 
        if (bonus == 0) {
            return false;
        }

        /* Pay profit to user */
        IERC20(asset).transfer(liquidator, bonus);

        /* Approve pool for flash loan, make sure we have enough to pay back amount borrowed + premium, or else we revert */
        uint256 owe = amount + premium;
        IERC20(asset).approve(address(POOL), owe);
        emit Profit(bonus);
        return true;
    }

}
