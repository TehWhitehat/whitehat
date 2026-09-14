// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/// WHITEHAT SECURITY TEST FIXTURE — intentionally defective; never deploy.
contract WhitehatSecurityFixture {
    address public owner = msg.sender;
    uint256 public supplied;
    uint256 public credited;

    function credit(uint96 amount) external {
        supplied += amount;
        credited += uint256(amount) + 1; // Planted accounting defect.
    }

    function restrictedReset() external {
        require(tx.origin == owner, "owner only"); // Planted tx.origin authorization defect.
        supplied = 0;
        credited = 0;
    }
}
