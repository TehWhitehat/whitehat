// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {WhitehatToken} from "../src/WhitehatToken.sol";
import {TargetRegistry} from "../src/TargetRegistry.sol";
import {BuybackVault} from "../src/BuybackVault.sol";
import {BuybackExecutor} from "../src/BuybackExecutor.sol";
import {BountyDistributor} from "../src/BountyDistributor.sol";
import {IBuybackRouter} from "../src/IBuybackRouter.sol";

interface Vm {
    function prank(address) external;
    function expectRevert() external;
    function expectRevert(bytes4) external;
    function expectRevert(bytes calldata) external;
    function warp(uint256) external;
    function chainId(uint256) external;
}
contract TestAsset is ERC20 {
    bool public fee;
    address public callback;
    bytes public payload;
    bytes4 public callbackError;
    constructor() ERC20("Mock USD", "mUSD") {}
    function decimals() public pure override returns(uint8) { return 6; }
    function mint(address to, uint256 amount) external { _mint(to, amount); }
    function setFee(bool value) external { fee=value; }
    function hook(address to, bytes memory data) external { callback=to; payload=data; }
    function _update(address from,address to,uint256 amount) internal override {
        if (callback != address(0) && from != address(0)) {
            address target=callback; callback=address(0);
            (bool ok,bytes memory reason)=target.call(payload);
            require(!ok,"reentry succeeded"); callbackError=bytes4(reason);
        }
        uint256 charge=fee && from!=address(0) && amount>0 ? 1 : 0;
        super._update(from,to,amount-charge);
        if(charge>0) super._update(from,address(0),charge);
    }
}
contract MockRouter is IBuybackRouter {
    uint256 public rate=1e12;
    address public callback;
    bytes public payload;
    bytes4 public callbackError;
    bool public lie;
    function setRate(uint256 value) external { rate=value; }
    function setLie() external { lie=true; }
    function hook(address to,bytes memory data) external { callback=to; payload=data; }
    function swap(address asset,address token,uint256 amount,uint256,address recipient,uint256 deadline) external returns(uint256 output) {
        require(block.timestamp<=deadline,"expired");
        if(callback!=address(0)) { (bool ok,bytes memory reason)=callback.call(payload); require(!ok,"reentry succeeded"); callbackError=bytes4(reason); }
        require(IERC20(asset).transferFrom(msg.sender,address(this),amount));
        output=amount*rate;
        if (!lie) require(IERC20(token).transfer(recipient,output));
    }
}

contract FoundationTest {
    Vm constant vm=Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    address constant ALICE=address(0xA11CE);
    address constant BOB=address(0xB0B);
    address constant TARGET=address(0xCAFE);
    WhitehatToken token;
    TargetRegistry registry;
    BuybackVault vault;
    BuybackExecutor executor;
    BountyDistributor distributor;
    TestAsset asset;
    MockRouter router;
    bytes32 id;
    function setUp() public {
        token=new WhitehatToken(address(this)); registry=new TargetRegistry();
        vault=new BuybackVault(address(this),IERC20(address(token)));
        executor=new BuybackExecutor(address(this),vault);
        distributor=new BountyDistributor(address(this),registry,vault);
        vault.grantRole(vault.EXECUTOR_ROLE(),address(executor));
        asset=new TestAsset(); router=new MockRouter();
        executor.setRouter(address(router),true);
        token.transfer(address(router),1_000_000 ether);
        asset.mint(address(this),1_000_000e6);
        asset.approve(address(distributor),type(uint256).max);
        vm.prank(ALICE); id=registry.register(46630,TARGET);
    }
    function testTokenFixedSupplyAndNoMint() public {
        require(token.totalSupply()==1_000_000_000 ether);
        require(token.decimals()==18);
        require(keccak256(bytes(token.name()))==keccak256("Whitehat"));
        require(keccak256(bytes(token.symbol()))==keccak256("WHITEHAT"));
        (bool ok,)=address(token).call(abi.encodeWithSignature("mint(address,uint256)",address(this),1));
        require(!ok); require(token.totalSupply()==1_000_000_000 ether);
        uint256 beforeBalance=token.balanceOf(BOB); token.transfer(BOB,123); require(token.balanceOf(BOB)==beforeBalance+123);
    }
    function testTokenRejectsZeroRecipient() public { vm.expectRevert(); new WhitehatToken(address(0)); }
    function testFirstScoutAndDuplicate() public {
        require(registry.originatingScout(id)==ALICE);
        vm.prank(BOB); vm.expectRevert(abi.encodeWithSelector(TargetRegistry.AlreadyRegistered.selector,id)); registry.register(46630,TARGET);
        require(registry.originatingScout(id)==ALICE);
    }
    function testChainSeparation() public { vm.prank(BOB); bytes32 other=registry.register(4663,TARGET); require(other!=id); require(registry.originatingScout(other)==BOB); }
    function testInvalidTarget() public { vm.expectRevert(); registry.register(0,TARGET); vm.expectRevert(); registry.register(46630,address(0)); }
    function testEvenSplit() public { distributor.finalize(bytes32(uint256(1)),id,asset,100e6); require(asset.balanceOf(ALICE)==50e6); require(asset.balanceOf(address(vault))==50e6); require(asset.balanceOf(address(distributor))==0); }
    function testOddAndOneUnitRounding() public { distributor.finalize(bytes32(uint256(1)),id,asset,101); require(asset.balanceOf(ALICE)==50); require(asset.balanceOf(address(vault))==51); distributor.finalize(bytes32(uint256(2)),id,asset,1); require(asset.balanceOf(ALICE)==50); require(asset.balanceOf(address(vault))==52); }
    function testFuzzConservation(uint64 amountSeed) public { uint256 amount=uint256(amountSeed)+1; asset.mint(address(this),amount); distributor.finalize(bytes32(uint256(1)),id,asset,amount); require(asset.balanceOf(ALICE)==amount/2); require(asset.balanceOf(address(vault))==amount-amount/2); require(asset.balanceOf(address(distributor))==0); }
    function testUnauthorizedBounty() public { vm.prank(BOB); vm.expectRevert(); distributor.finalize(bytes32(uint256(1)),id,asset,100); }
    function testDuplicateBounty() public { distributor.finalize(bytes32(uint256(1)),id,asset,100); vm.expectRevert(BountyDistributor.AlreadyProcessed.selector); distributor.finalize(bytes32(uint256(1)),id,asset,100); require(asset.balanceOf(ALICE)==50); }
    function testUnknownTarget() public { vm.expectRevert(BountyDistributor.UnknownTarget.selector); distributor.finalize(bytes32(uint256(1)),bytes32(uint256(99)),asset,100); }
    function testFeeAssetRollback() public { asset.setFee(true); vm.expectRevert(); distributor.finalize(bytes32(uint256(1)),id,asset,100); require(!distributor.processed(bytes32(uint256(1)))); require(asset.balanceOf(ALICE)==0); }
    function fundVault() internal { asset.approve(address(vault),100e6); vault.deposit(asset,100e6); }
    function testBuybackAndAllowanceReset() public { fundVault(); uint256 output=executor.execute(address(router),asset,100e6,100 ether,block.timestamp+60); require(output==100 ether); require(token.balanceOf(address(vault))==100 ether); require(asset.balanceOf(address(vault))==0); require(asset.allowance(address(vault),address(router))==0); }
    function testUnauthorizedExecutionAndWithdrawal() public { fundVault(); vm.prank(BOB); vm.expectRevert(); executor.execute(address(router),asset,100e6,1,block.timestamp+60); vm.prank(BOB); vm.expectRevert(); vault.executeSwap(address(router),asset,100e6,1,block.timestamp+60); }
    function testUnapprovedRouter() public { fundVault(); executor.setRouter(address(router),false); vm.expectRevert(BuybackExecutor.InvalidRouter.selector); executor.execute(address(router),asset,100e6,1,block.timestamp+60); }
    function testSlippageRollback() public { fundVault(); vm.expectRevert(BuybackVault.InsufficientOutput.selector); executor.execute(address(router),asset,100e6,101 ether,block.timestamp+60); require(asset.balanceOf(address(vault))==100e6); require(token.balanceOf(address(vault))==0); require(asset.allowance(address(vault),address(router))==0); }
    function testLyingRouterOutputRejected() public { fundVault(); router.setLie(); vm.expectRevert(BuybackVault.InsufficientOutput.selector); executor.execute(address(router),asset,100e6,1,block.timestamp+60); require(asset.balanceOf(address(vault))==100e6); }
    function testDeadlineAndZeroMinimum() public { fundVault(); vm.warp(100); vm.expectRevert(); executor.execute(address(router),asset,100e6,1,99); vm.expectRevert(); executor.execute(address(router),asset,100e6,0,200); }
    function testPauseControls() public { fundVault(); executor.pause(); vm.expectRevert(); executor.execute(address(router),asset,1,1,block.timestamp+60); executor.unpause(); vault.pause(); vm.expectRevert(); executor.execute(address(router),asset,1,1,block.timestamp+60); vm.expectRevert(); distributor.finalize(bytes32(uint256(1)),id,asset,100); require(!distributor.processed(bytes32(uint256(1)))); vault.unpause(); distributor.pause(); vm.expectRevert(); distributor.finalize(bytes32(uint256(1)),id,asset,100); }
    function testRolesAndAdminTransfer() public { vm.prank(BOB); vm.expectRevert(); executor.setRouter(address(router),false); vm.prank(BOB); vm.expectRevert(); vault.pause(); executor.beginDefaultAdminTransfer(BOB); vm.prank(BOB); vm.expectRevert(); executor.acceptDefaultAdminTransfer(); vm.warp(block.timestamp+1 days+1); vm.prank(BOB); executor.acceptDefaultAdminTransfer(); require(executor.defaultAdmin()==BOB); }
    function testExecutorReentrancy() public { fundVault(); executor.grantRole(executor.BUYBACK_OPERATOR_ROLE(),address(router)); router.hook(address(executor),abi.encodeCall(executor.execute,(address(router),IERC20(address(asset)),1,1,block.timestamp+60))); executor.execute(address(router),asset,100e6,1,block.timestamp+60); require(router.callbackError()==bytes4(keccak256("ReentrancyGuardReentrantCall()"))); }
    function testVaultReentrancy() public { fundVault(); router.hook(address(vault),abi.encodeCall(vault.deposit,(IERC20(address(asset)),1))); executor.execute(address(router),asset,100e6,1,block.timestamp+60); require(router.callbackError()==bytes4(keccak256("ReentrancyGuardReentrantCall()"))); }
    function testBountyReentrancy() public { distributor.grantRole(distributor.BOUNTY_OPERATOR_ROLE(),address(asset)); asset.hook(address(distributor),abi.encodeCall(distributor.finalize,(bytes32(uint256(2)),id,IERC20(address(asset)),10))); distributor.finalize(bytes32(uint256(1)),id,asset,100); require(asset.callbackError()==bytes4(keccak256("ReentrancyGuardReentrantCall()"))); require(!distributor.processed(bytes32(uint256(2)))); }
}
