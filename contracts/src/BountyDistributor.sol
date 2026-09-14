// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {WhitehatRoles} from "./WhitehatRoles.sol";
import {TargetRegistry} from "./TargetRegistry.sol";
import {BuybackVault} from "./BuybackVault.sol";

contract BountyDistributor is WhitehatRoles, ReentrancyGuard {
    using SafeERC20 for IERC20;
    bytes32 public constant BOUNTY_OPERATOR_ROLE = keccak256("BOUNTY_OPERATOR_ROLE");
    uint256 public constant SCOUT_BPS = 5000;
    uint256 public constant BUYBACK_BPS = 5000;
    TargetRegistry public immutable registry;
    BuybackVault public immutable vault;
    mapping(bytes32 => bool) public processed;
    error InvalidBounty();
    error UnknownTarget();
    error AlreadyProcessed();
    error UnsupportedAsset();
    event BountyDistributed(bytes32 indexed bountyId, bytes32 indexed targetId, address indexed asset, address scout, uint256 amount, uint256 scoutAmount, uint256 buybackAmount);
    constructor(address admin, TargetRegistry targetRegistry, BuybackVault targetVault) WhitehatRoles(admin) {
        if (address(targetRegistry).code.length == 0 || address(targetVault).code.length == 0) revert InvalidBounty();
        registry = targetRegistry; vault = targetVault;
        _grantRole(BOUNTY_OPERATOR_ROLE, admin);
    }
    /// Pull from the authorized operator. Odd smallest units go to the buyback half.
    function finalize(bytes32 bountyId, bytes32 targetId, IERC20 asset, uint256 amount) external onlyRole(BOUNTY_OPERATOR_ROLE) whenNotPaused nonReentrant {
        if (bountyId == bytes32(0) || amount == 0 || address(asset).code.length == 0) revert InvalidBounty();
        if (processed[bountyId]) revert AlreadyProcessed();
        address scout = registry.originatingScout(targetId);
        if (scout == address(0)) revert UnknownTarget();
        processed[bountyId] = true;
        uint256 beforeBalance = asset.balanceOf(address(this));
        asset.safeTransferFrom(msg.sender, address(this), amount);
        if (asset.balanceOf(address(this)) != beforeBalance + amount) revert UnsupportedAsset();
        uint256 scoutAmount = amount / 2;
        uint256 buybackAmount = amount - scoutAmount;
        uint256 beforeScout = asset.balanceOf(scout);
        if (scoutAmount != 0) asset.safeTransfer(scout, scoutAmount);
        if (asset.balanceOf(scout) != beforeScout + scoutAmount) revert UnsupportedAsset();
        asset.forceApprove(address(vault), buybackAmount);
        vault.deposit(asset, buybackAmount);
        asset.forceApprove(address(vault), 0);
        emit BountyDistributed(bountyId, targetId, address(asset), scout, amount, scoutAmount, buybackAmount);
    }
}
