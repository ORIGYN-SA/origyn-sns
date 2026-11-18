// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.28;

import { Script, console2 } from "forge-std/Script.sol";

import { DeployLocalCore, LocalChain } from "./lib/DeployLocalCore.sol";

/// @notice Plain anvil only: the LayerZero test stack and two GLDT tokens, for the gldt_swap end to end test. Writes
/// deployments/local.json. The signers are the gldt_swap test canister's addresses, passed in by the e2e:
///
///   ADMIN_SIGNER=0x... ICP_SIGNER=0x... forge script script/DeployLocal.s.sol --rpc-url http://127.0.0.1:8545 \
///     --unlocked --sender 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --broadcast --slow
///
/// Keep `--slow`: the 50 transactions fill anvil's blocks, its base fee rises above the fee forge fixed up front,
/// and without `--slow` the last transactions stay pending forever.
/// OPERATOR defaults to the sender. Without ADMIN_SIGNER and ICP_SIGNER, anvil's public accounts 1 and 2 stand in.
contract DeployLocal is Script, DeployLocalCore {
    address internal constant ANVIL_ACCOUNT_1 = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
    address internal constant ANVIL_ACCOUNT_2 = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;

    function run() external {
        require(block.chainid == 31337, "DeployLocal is for a plain anvil (chain id 31337)");
        address adminSigner = vm.envOr("ADMIN_SIGNER", ANVIL_ACCOUNT_1);
        address icpSigner = vm.envOr("ICP_SIGNER", ANVIL_ACCOUNT_2);

        vm.startBroadcast();
        (, address deployer, ) = vm.readCallers();
        address operator = vm.envOr("OPERATOR", deployer);
        (LocalChain memory a, LocalChain memory b) = _deployLocal(deployer, operator, adminSigner, icpSigner);
        vm.stopBroadcast();

        string memory root = "local";
        vm.serializeUint(root, "chainId", block.chainid);
        vm.serializeAddress(root, "deployer", deployer);
        vm.serializeAddress(root, "operator", operator);
        vm.serializeAddress(root, "adminSigner", adminSigner);
        vm.serializeAddress(root, "icpSigner", icpSigner);
        vm.serializeString(root, "tokenA", _chainJson("tokenA", a));
        string memory json = vm.serializeString(root, "tokenB", _chainJson("tokenB", b));
        vm.createDir("deployments", true);
        vm.writeJson(json, "deployments/local.json");
        console2.log("tokenA (eid 1)", a.token);
        console2.log("tokenB (eid 2)", b.token);
        console2.log("written to deployments/local.json");
    }

    function _chainJson(string memory key, LocalChain memory c) private returns (string memory) {
        vm.serializeUint(key, "eid", c.eid);
        vm.serializeAddress(key, "endpoint", c.endpoint);
        vm.serializeAddress(key, "sendLib", c.sendLib);
        vm.serializeAddress(key, "receiveLib", c.receiveLib);
        vm.serializeAddress(key, "executor", c.executor);
        vm.serializeAddress(key, "dvns", c.dvns);
        vm.serializeAddress(key, "implementation", c.implementation);
        return vm.serializeAddress(key, "token", c.token);
    }
}
