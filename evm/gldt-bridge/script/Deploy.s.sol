// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.28;

import { Script, console2 } from "forge-std/Script.sol";

import { GLDTConfig, GLDTDeployment } from "./lib/GLDTConfig.sol";
import { GLDTDeployCore } from "./lib/GLDTDeployCore.sol";

/// @notice Spec 7.3: deploys the GLDT implementation, then the proxy through CreateX CREATE3, from the operator
/// wallet, and writes deployments/<chain>.json. Run on Ethereum, then Base, back to back, then run Check.s.sol.
///
///   forge script script/Deploy.s.sol --sig 'run(string)' ethereum \
///     --rpc-url <url> --ledger --sender <operator wallet> --broadcast
///
/// `--account <keystore>` works in place of `--ledger`. Never pass a private key on the command line.
/// Then verify the source on Etherscan and Basescan (spec 7.3 step 3), built with this same foundry.toml.
/// The file is written after the simulation, before the broadcast; its `block` is the block the simulation ran on,
/// so the deployment lands at or after it.
contract Deploy is Script, GLDTDeployCore {
    function run(string calldata chain) external {
        run(string.concat("script/config/", chain, ".json"), string.concat("deployments/", chain, ".json"));
    }

    function run(string memory configPath, string memory deploymentPath) public {
        GLDTConfig memory c = _loadConfig(configPath);
        require(block.chainid == c.chainId, "this RPC is not the config's chain");

        vm.startBroadcast();
        (, address deployer, ) = vm.readCallers();
        console2.log("deployer", deployer);
        console2.log("predicted proxy", _predictProxy(deployer, c.salt));
        GLDTDeployment memory d = _deployGLDT(c, deployer);
        vm.stopBroadcast();

        string memory key = "deployment";
        vm.serializeUint(key, "chainId", d.chainId);
        vm.serializeAddress(key, "proxy", d.proxy);
        vm.serializeAddress(key, "implementation", d.implementation);
        vm.serializeBytes32(key, "implementationCodeHash", d.implementationCodeHash);
        string memory json = vm.serializeUint(key, "block", d.blockNumber);
        vm.createDir("deployments", true);
        vm.writeJson(json, deploymentPath);

        console2.log("proxy", d.proxy);
        console2.log("implementation", d.implementation);
        console2.log("implementation code hash", vm.toString(d.implementationCodeHash));
        console2.log("written to", deploymentPath);
    }
}
