// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {WhitehatToken} from "../src/WhitehatToken.sol";
import {TargetRegistry} from "../src/TargetRegistry.sol";
import {BuybackVault} from "../src/BuybackVault.sol";
import {BuybackExecutor} from "../src/BuybackExecutor.sol";
import {BountyDistributor} from "../src/BountyDistributor.sol";

interface DeployVm {
    function envUint(string calldata) external returns(uint256);
    function envOr(string calldata,address) external returns(address);
    function addr(uint256) external returns(address);
    function startBroadcast(uint256) external;
    function stopBroadcast() external;
}
contract DeployTestnet {
    DeployVm constant vm=DeployVm(address(uint160(uint256(keccak256("hevm cheat code")))));
    error TestnetOnly();
    function run() external returns(WhitehatToken token,TargetRegistry registry,BuybackVault vault,BuybackExecutor executor,BountyDistributor distributor) {
        if(block.chainid!=46630) revert TestnetOnly();
        uint256 key=vm.envUint("WHITEHAT_TESTNET_PRIVATE_KEY");
        address admin=vm.addr(key);
        address recipient=vm.envOr("WHITEHAT_TESTNET_TOKEN_RECIPIENT",admin);
        vm.startBroadcast(key);
        token=new WhitehatToken(recipient);
        registry=new TargetRegistry();
        vault=new BuybackVault(admin);
        vault.setWhitehatToken(address(token));
        executor=new BuybackExecutor(admin,vault);
        distributor=new BountyDistributor(admin,registry,vault);
        vault.grantRole(vault.EXECUTOR_ROLE(),address(executor));
        // All routers remain disabled. No trading or target registrations occur here.
        vm.stopBroadcast();
    }
}
