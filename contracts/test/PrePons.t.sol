// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;
import {BuybackVault} from "../src/BuybackVault.sol";
import {BuybackExecutor} from "../src/BuybackExecutor.sol";
import {BountyDistributor} from "../src/BountyDistributor.sol";
import {TargetRegistry} from "../src/TargetRegistry.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {TestAsset, MockRouter} from "./Foundation.t.sol";
interface InitVm {
    function prank(address) external;
    function expectRevert(bytes4) external;
    function expectRevert(bytes calldata) external;
    function expectEmit(bool,bool,bool,bool,address) external;
    function warp(uint256) external;
}
contract PrePonsTest {
    InitVm constant vm = InitVm(address(uint160(uint256(keccak256("hevm cheat code")))));
    event WhitehatTokenInitialised(address indexed token,address indexed admin);
    BuybackVault vault;
    BuybackExecutor executor;
    BountyDistributor distributor;
    TargetRegistry registry;
    TestAsset asset;
    TestAsset token;
    MockRouter router;
    address constant SCOUT=address(0xA11CE);
    address constant OTHER=address(0xB0B);
    bytes32 id;
    function setUp() public {
        registry=new TargetRegistry();
        vault=new BuybackVault(address(this));
        executor=new BuybackExecutor(address(this),vault);
        distributor=new BountyDistributor(address(this),registry,vault);
        vault.grantRole(vault.EXECUTOR_ROLE(),address(executor));
        asset=new TestAsset();token=new TestAsset();router=new MockRouter();
        vm.prank(SCOUT);id=registry.register(4663,address(0xCAFE));
    }
    function unauthorized(address caller) internal pure returns(bytes memory) {
        return abi.encodeWithSignature("AccessControlUnauthorizedAccount(address,bytes32)",caller,bytes32(0));
    }
    function testDeployUnsetAndReferences() public view {
        require(address(vault.whitehat())==address(0));
        require(vault.defaultAdmin()==address(this));
        require(address(executor.vault())==address(vault));
        require(address(distributor.vault())==address(vault));
        require(address(distributor.registry())==address(registry));
        require(!executor.routers(address(router)));
    }
    function testAdminBindsOnceAndEmits() public {
        vm.expectEmit(true,true,false,true,address(vault));
        emit WhitehatTokenInitialised(address(token),address(this));
        vault.setWhitehatToken(address(token));
        require(address(vault.whitehat())==address(token));
        vm.expectRevert(BuybackVault.TokenAlreadyInitialised.selector);
        vault.setWhitehatToken(address(asset));
        require(address(vault.whitehat())==address(token));
    }
    function testSameTokenCannotBeSetTwice() public {
        vault.setWhitehatToken(address(token));
        vm.expectRevert(BuybackVault.TokenAlreadyInitialised.selector);vault.setWhitehatToken(address(token));
    }
    function testRejectZeroAndEOAWithoutConsumingInitialisation() public {
        vm.expectRevert(BuybackVault.UnsupportedAsset.selector);vault.setWhitehatToken(address(0));
        vm.expectRevert(BuybackVault.UnsupportedAsset.selector);vault.setWhitehatToken(OTHER);
        require(address(vault.whitehat())==address(0));vault.setWhitehatToken(address(token));
    }
    function testUnauthorisedCannotBind() public {
        vm.prank(OTHER);vm.expectRevert(unauthorized(OTHER));vault.setWhitehatToken(address(token));
        require(address(vault.whitehat())==address(0));
    }
    function testOperatorCannotBind() public {
        vault.grantRole(vault.EXECUTOR_ROLE(),OTHER);
        vm.prank(OTHER);vm.expectRevert(unauthorized(OTHER));vault.setWhitehatToken(address(token));
    }
    function testDirectSwapBeforeBindingRevertsBeforeApproval() public {
        vault.grantRole(vault.EXECUTOR_ROLE(),address(this));
        vm.expectRevert(BuybackVault.TokenNotInitialised.selector);
        vault.executeSwap(address(router),asset,1,1,block.timestamp);
        require(asset.allowance(address(vault),address(router))==0);
    }
    function testExecutorWithoutRouterReverts() public {
        vm.expectRevert(BuybackExecutor.InvalidRouter.selector);
        executor.execute(address(router),asset,1,1,block.timestamp);
    }
    function testExecutorWithRouterStillRequiresToken() public {
        executor.setRouter(address(router),true);
        vm.expectRevert(BuybackVault.TokenNotInitialised.selector);
        executor.execute(address(router),asset,1,1,block.timestamp);
        require(asset.allowance(address(vault),address(router))==0);
    }
    function testBindingDoesNotEnableRouter() public {
        vault.setWhitehatToken(address(token));
        require(!executor.routers(address(router)));
        vm.expectRevert(BuybackExecutor.InvalidRouter.selector);
        executor.execute(address(router),asset,1,1,block.timestamp);
    }
    function testAdminTransferDoesNotPermitRebinding() public {
        vault.setWhitehatToken(address(token));
        vault.beginDefaultAdminTransfer(OTHER);vm.warp(block.timestamp+1 days+1);
        vm.prank(OTHER);vault.acceptDefaultAdminTransfer();
        vm.prank(OTHER);vm.expectRevert(BuybackVault.TokenAlreadyInitialised.selector);vault.setWhitehatToken(address(asset));
        require(address(vault.whitehat())==address(token));
    }
    function testNewAdminMayPerformFirstBinding() public {
        vault.beginDefaultAdminTransfer(OTHER);vm.warp(block.timestamp+1 days+1);
        vm.prank(OTHER);vault.acceptDefaultAdminTransfer();
        vm.expectRevert(unauthorized(address(this)));vault.setWhitehatToken(address(token));
        vm.prank(OTHER);vault.setWhitehatToken(address(token));
    }
    function testFuzzPreBindingSplit(uint64 seed) public {
        uint256 amount=uint256(seed)+1;
        asset.mint(address(this),amount);asset.approve(address(distributor),amount);
        distributor.finalize(bytes32(uint256(1)),id,asset,amount);
        require(asset.balanceOf(SCOUT)==amount/2);
        require(vault.balance(address(asset))==amount-amount/2);
        require(asset.balanceOf(address(distributor))==0);
        require(address(vault.whitehat())==address(0));
        require(registry.originatingScout(id)==SCOUT);
        vm.prank(OTHER);vm.expectRevert(abi.encodeWithSelector(TargetRegistry.AlreadyRegistered.selector,id));
        registry.register(4663,address(0xCAFE));
    }
}
