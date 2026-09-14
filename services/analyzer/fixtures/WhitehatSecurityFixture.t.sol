// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;
import "../sources/WhitehatSecurityFixture.sol";

/// WHITEHAT SECURITY TEST FIXTURE — offline EVM execution only.
contract WhitehatSecurityFixtureTest {
    WhitehatSecurityFixture internal fixture;
    function setUp() public { fixture = new WhitehatSecurityFixture(); }

    function testFuzz_creditConservation(uint96 amount) public {
        fixture.credit(amount);
        require(fixture.credited() == fixture.supplied(), "CREDIT_CONSERVATION_VIOLATED");
    }

    function testFuzz_ownerUnaffected(uint96 amount) public {
        address beforeOwner = fixture.owner();
        fixture.credit(amount);
        require(fixture.owner() == beforeOwner, "OWNER_CHANGED");
    }

    function targetContracts() public view returns (address[] memory targets) {
        targets = new address[](1);
        targets[0] = address(fixture);
    }

    function invariant_creditConservation() public view {
        require(fixture.credited() == fixture.supplied(), "CREDIT_CONSERVATION_VIOLATED");
    }
}
