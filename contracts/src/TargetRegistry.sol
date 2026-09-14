// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/// Public first-inclusion attribution, not proof of bounty eligibility.
contract TargetRegistry {
    struct Target { uint256 chainId; address target; address scout; uint256 registeredAt; }
    mapping(bytes32 => Target) public targets;
    error InvalidTarget();
    error AlreadyRegistered(bytes32 targetId);
    event TargetRegistered(bytes32 indexed targetId, uint256 indexed chainId, address indexed target, address scout, uint256 registeredAt);

    function targetId(uint256 chainId, address target) public pure returns (bytes32) {
        return keccak256(abi.encode(chainId, target));
    }
    function register(uint256 chainId, address target) external returns (bytes32 id) {
        if (chainId == 0 || target == address(0)) revert InvalidTarget();
        id = targetId(chainId, target);
        if (targets[id].scout != address(0)) revert AlreadyRegistered(id);
        targets[id] = Target(chainId, target, msg.sender, block.timestamp);
        emit TargetRegistered(id, chainId, target, msg.sender, block.timestamp);
    }
    function originatingScout(bytes32 id) external view returns (address) { return targets[id].scout; }
}
