// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
/// TEST ONLY. No relation to real USDC. Fixed 100 mock units.
contract MockUSDC is ERC20 {
    constructor(address recipient) ERC20("MockUSDC TEST ONLY", "TEST-USDC") {
        require(block.chainid == 46630, "TESTNET ONLY");
        _mint(recipient, 100 * 10 ** 6);
    }
    function decimals() public pure override returns (uint8) { return 6; }
}
