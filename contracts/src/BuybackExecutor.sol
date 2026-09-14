// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {WhitehatRoles} from "./WhitehatRoles.sol";
import {BuybackVault} from "./BuybackVault.sol";

contract BuybackExecutor is WhitehatRoles, ReentrancyGuard {
    bytes32 public constant BUYBACK_OPERATOR_ROLE = keccak256("BUYBACK_OPERATOR_ROLE");
    BuybackVault public immutable vault;
    mapping(address => bool) public routers;
    error InvalidRouter();
    error InvalidVault();
    event RouterAllowed(address indexed router, bool allowed);
    event BuybackExecuted(address indexed operator, address indexed asset, address indexed router, uint256 amountIn, uint256 minOut, uint256 amountOut, uint256 deadline);
    constructor(address admin, BuybackVault targetVault) WhitehatRoles(admin) {
        if (address(targetVault).code.length == 0) revert InvalidVault();
        vault = targetVault;
        _grantRole(BUYBACK_OPERATOR_ROLE, admin);
    }
    function setRouter(address router, bool allowed) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (router == address(0) || (allowed && router.code.length == 0)) revert InvalidRouter();
        routers[router] = allowed;
        emit RouterAllowed(router, allowed);
    }
    function execute(address router, IERC20 asset, uint256 amount, uint256 minOut, uint256 deadline)
        external onlyRole(BUYBACK_OPERATOR_ROLE) whenNotPaused nonReentrant returns (uint256 output)
    {
        if (!routers[router]) revert InvalidRouter();
        output = vault.executeSwap(router, asset, amount, minOut, deadline);
        emit BuybackExecuted(msg.sender, address(asset), router, amount, minOut, output, deadline);
    }
}
