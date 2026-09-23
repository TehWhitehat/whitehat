// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;
import {DeployWhitehatMainnet} from "../script/DeployWhitehatMainnet.s.sol";
import {TargetRegistry} from "../src/TargetRegistry.sol";
import {BuybackVault} from "../src/BuybackVault.sol";
import {BuybackExecutor} from "../src/BuybackExecutor.sol";
import {BountyDistributor} from "../src/BountyDistributor.sol";
interface DeployTestVm {
 function chainId(uint256) external;
 function setEnv(string calldata,string calldata) external;
 function expectRevert(bytes4) external;
}
contract ScriptHarness is DeployWhitehatMainnet {
 address private deployer;
 address private admin;
 constructor(address d,address a){deployer=d;admin=a;}
 function recipients() internal view override returns(address,address){return(deployer,admin);}
}
contract MainnetDeploymentTest {
 DeployTestVm constant vm=DeployTestVm(address(uint160(uint256(keccak256("hevm cheat code")))));
 address constant DEPLOYER=0x0000000000000000000000000000000000001111;
 address constant ADMIN=0x0000000000000000000000000000000000002222;

 function testRejectTestnet() public {vm.chainId(46630);DeployWhitehatMainnet script=new ScriptHarness(DEPLOYER,ADMIN);vm.expectRevert(DeployWhitehatMainnet.MainnetOnly.selector);script.run();}
 function testFuzzRejectOtherChains(uint64 id) public {if(id==4663)return;vm.chainId(id);DeployWhitehatMainnet script=new ScriptHarness(DEPLOYER,ADMIN);vm.expectRevert(DeployWhitehatMainnet.MainnetOnly.selector);script.run();}
 function testRejectZeroAdmin() public {vm.chainId(4663);DeployWhitehatMainnet script=new ScriptHarness(DEPLOYER,address(0));vm.expectRevert(DeployWhitehatMainnet.InvalidRecipient.selector);script.run();}
 function testRejectZeroDeployer() public {vm.chainId(4663);DeployWhitehatMainnet script=new ScriptHarness(address(0),ADMIN);vm.expectRevert(DeployWhitehatMainnet.InvalidRecipient.selector);script.run();}
 function testMainnetDeploymentAndPermissions() public {
  vm.chainId(4663);
  (TargetRegistry r,BuybackVault v,BuybackExecutor e,BountyDistributor d)=(new ScriptHarness(DEPLOYER,ADMIN)).run();
  require(address(r).code.length>0&&address(v).code.length>0&&address(e).code.length>0&&address(d).code.length>0);
  require(address(v.whitehat())==address(0));
  require(v.defaultAdmin()==ADMIN&&e.defaultAdmin()==ADMIN&&d.defaultAdmin()==ADMIN);
  require(v.hasRole(v.EXECUTOR_ROLE(),address(e)));
  require(!v.hasRole(v.EXECUTOR_ROLE(),DEPLOYER));
  require(!v.hasRole(v.DEFAULT_ADMIN_ROLE(),DEPLOYER));
  require(!e.hasRole(e.BUYBACK_OPERATOR_ROLE(),DEPLOYER));
  require(e.hasRole(e.BUYBACK_OPERATOR_ROLE(),ADMIN)&&d.hasRole(d.BOUNTY_OPERATOR_ROLE(),ADMIN));
  require(address(e.vault())==address(v)&&address(d.vault())==address(v)&&address(d.registry())==address(r));
  require(!e.routers(address(0))&&!e.routers(ADMIN));
 }
}
