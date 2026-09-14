// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/// Adapter interface. No production router is selected or allowlisted by deployment.
interface IBuybackRouter {
    function swap(address assetIn, address tokenOut, uint256 amountIn, uint256 minOut, address recipient, uint256 deadline) external returns (uint256 amountOut);
}
