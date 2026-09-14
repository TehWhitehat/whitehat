// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;
import {MockUSDC} from "../src/testnet/MockUSDC.sol";
import {TestOnlyRouter} from "../src/testnet/TestOnlyRouter.sol";
interface TestVm { function chainId(uint256) external; function expectRevert() external; }
contract TestnetMocksTest {
    TestVm constant vm = TestVm(address(uint160(uint256(keccak256("hevm cheat code")))));
    function testRejectOtherNetworks() public {
        vm.chainId(4663); vm.expectRevert(); new MockUSDC(address(this));
        vm.expectRevert(); new TestOnlyRouter(address(this), address(1), address(2));
    }
    function testMockSwapAndMinimum() public {
        vm.chainId(46630);
        MockUSDC asset = new MockUSDC(address(this));
        MockUSDC output = new MockUSDC(address(this));
        TestOnlyRouter router = new TestOnlyRouter(address(this), address(asset), address(output));
        output.transfer(address(router), 1000000);
        asset.approve(address(router), 1);
        vm.expectRevert(); router.swap(address(asset), address(output), 1, 1e12 + 1, address(this), block.timestamp);
        require(asset.balanceOf(address(this)) == 100e6, "rollback");
    }
}
