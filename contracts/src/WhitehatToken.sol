// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// Fixed supply; no admin, mint endpoint, fees, blacklist or upgrade mechanism.
contract WhitehatToken is ERC20 {
    uint256 public constant INITIAL_SUPPLY = 1_000_000_000 ether;
    constructor(address recipient) ERC20("Whitehat", "WHITEHAT") {
        _mint(recipient, INITIAL_SUPPLY);
    }
}
