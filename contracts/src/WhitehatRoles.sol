// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;
import {AccessControlDefaultAdminRules} from "@openzeppelin/contracts/access/extensions/AccessControlDefaultAdminRules.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

abstract contract WhitehatRoles is AccessControlDefaultAdminRules, Pausable {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    constructor(address admin) AccessControlDefaultAdminRules(1 days, admin) { _grantRole(PAUSER_ROLE, admin); }
    function pause() external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }
}
