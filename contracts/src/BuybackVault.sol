// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {WhitehatRoles} from "./WhitehatRoles.sol";
import {IBuybackRouter} from "./IBuybackRouter.sol";

/// Holds both bounty assets and purchased WHITEHAT. No burn or arbitrary withdrawal.
contract BuybackVault is WhitehatRoles, ReentrancyGuard {
    using SafeERC20 for IERC20;
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");
    IERC20 public immutable whitehat;
    error InvalidSwap();
    error UnsupportedAsset();
    error InsufficientOutput();
    event Deposited(address indexed asset, address indexed from, uint256 amount);
    event Purchased(address indexed router, address indexed asset, uint256 amountIn, uint256 amountOut);
    constructor(address admin, IERC20 token) WhitehatRoles(admin) {
        if (address(token).code.length == 0) revert UnsupportedAsset();
        whitehat = token;
    }
    function balance(address asset) external view returns (uint256) { return IERC20(asset).balanceOf(address(this)); }
    function deposit(IERC20 asset, uint256 amount) external whenNotPaused nonReentrant {
        if (amount == 0 || address(asset).code.length == 0) revert UnsupportedAsset();
        uint256 beforeBalance = asset.balanceOf(address(this));
        asset.safeTransferFrom(msg.sender, address(this), amount);
        if (asset.balanceOf(address(this)) != beforeBalance + amount) revert UnsupportedAsset();
        emit Deposited(address(asset), msg.sender, amount);
    }
    function executeSwap(address router, IERC20 asset, uint256 amount, uint256 minOut, uint256 deadline)
        external onlyRole(EXECUTOR_ROLE) whenNotPaused nonReentrant returns (uint256 output)
    {
        if (router.code.length == 0 || address(asset) == address(whitehat) || amount == 0 || minOut == 0 || block.timestamp > deadline) revert InvalidSwap();
        uint256 beforeInput = asset.balanceOf(address(this));
        uint256 beforeOutput = whitehat.balanceOf(address(this));
        asset.forceApprove(router, amount);
        uint256 reportedOutput = IBuybackRouter(router).swap(address(asset), address(whitehat), amount, minOut, address(this), deadline);
        asset.forceApprove(router, 0);
        if (beforeInput < amount || asset.balanceOf(address(this)) != beforeInput - amount) revert UnsupportedAsset();
        output = whitehat.balanceOf(address(this)) - beforeOutput;
        if (output < minOut || output != reportedOutput) revert InsufficientOutput();
        emit Purchased(router, address(asset), amount, output);
    }
}
