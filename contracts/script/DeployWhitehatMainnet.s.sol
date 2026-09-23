// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;
import {TargetRegistry} from "../src/TargetRegistry.sol";
import {BuybackVault} from "../src/BuybackVault.sol";
import {BuybackExecutor} from "../src/BuybackExecutor.sol";
import {BountyDistributor} from "../src/BountyDistributor.sol";

interface MainnetDeployVm {
    function envAddress(string calldata) external returns (address);
    function startBroadcast(address) external;
    function stopBroadcast() external;
}

/// Dry-run by default. Broadcasting requires separately supplied signer(s).
/// If admin differs from deployer, its signature is also required for the role grant.
contract DeployWhitehatMainnet {
    MainnetDeployVm constant vm = MainnetDeployVm(address(uint160(uint256(keccak256("hevm cheat code")))));
    error MainnetOnly();
    error InvalidRecipient();
    function recipients() internal virtual returns (address deployer, address admin) {
        return (vm.envAddress("WHITEHAT_MAINNET_DEPLOYER"), vm.envAddress("WHITEHAT_MAINNET_ADMIN"));
    }
    function run() external returns (TargetRegistry registry, BuybackVault vault, BuybackExecutor executor, BountyDistributor distributor) {
        if (block.chainid != 4663) revert MainnetOnly();
        (address deployer, address admin) = recipients();
        if (deployer == address(0) || admin == address(0)) revert InvalidRecipient();
        vm.startBroadcast(deployer);
        registry = new TargetRegistry();
        vault = new BuybackVault(admin);
        executor = new BuybackExecutor(admin, vault);
        distributor = new BountyDistributor(admin, registry, vault);
        vm.stopBroadcast();
        vm.startBroadcast(admin);
        vault.grantRole(vault.EXECUTOR_ROLE(), address(executor));
        vm.stopBroadcast();
        // No token deployment/binding, router permission, deposit or buyback.
        assert(address(vault.whitehat()) == address(0));
        assert(vault.defaultAdmin() == admin && executor.defaultAdmin() == admin && distributor.defaultAdmin() == admin);
        assert(vault.hasRole(vault.EXECUTOR_ROLE(), address(executor)));
        assert(address(executor.vault()) == address(vault));
        assert(address(distributor.registry()) == address(registry) && address(distributor.vault()) == address(vault));
    }
}
