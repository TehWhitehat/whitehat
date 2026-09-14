// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IBuybackRouter} from "../IBuybackRouter.sol";
/// TEST ONLY. Fixed demonstration ratio, not a market price or production DEX.
contract TestOnlyRouter is IBuybackRouter {
    using SafeERC20 for IERC20;
    address public immutable vault;
    address public immutable mock;
    address public immutable whitehat;
    constructor(address v, address m, address w) {
        require(block.chainid == 46630, "TESTNET ONLY");
        vault = v; mock = m; whitehat = w;
    }
    function swap(address asset, address token, uint256 amount, uint256 minimum, address recipient, uint256 deadline) external returns (uint256 output) {
        require(block.chainid == 46630 && msg.sender == vault && recipient == vault, "TEST VAULT ONLY");
        require(asset == mock && token == whitehat && block.timestamp <= deadline, "INVALID TEST SWAP");
        output = amount * 1e12;
        require(output >= minimum, "TEST MINIMUM OUTPUT");
        IERC20(mock).safeTransferFrom(msg.sender, address(this), amount);
        IERC20(whitehat).safeTransfer(recipient, output);
    }
}
