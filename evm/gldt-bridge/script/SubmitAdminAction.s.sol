// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.28;

import { Script, console2 } from "forge-std/Script.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

import { IGLDT } from "../src/IGLDT.sol";

/// @notice Submits an admin action signed by gldt_swap. Anyone may submit and pay the gas; the signature
/// is the authority. The argument is the JSON text of get_bridge_admin_action, as dfx prints it:
///
///   forge script script/SubmitAdminAction.s.sol --sig 'run(string)' \
///     "$(dfx canister call gldt_swap get_bridge_admin_action '(7 : nat64)' --network ic --query --output json)" \
///     --rpc-url <url of the action's chain> --account <keystore> --sender <address> --broadcast
///
/// dfx prints `opt` as a one element array, nat64 as a decimal string and blob as an array of byte numbers.
/// A single SignedEvmAdminAction object with plain numbers and 0x hex works too. Before broadcasting, the script
/// checks the chain id, the deadline, the nonce and that the token's adminSigner signed the action.
contract SubmitAdminAction is Script {
    struct Action {
        uint64 id;
        uint256 chainId;
        address token;
        IGLDT.Call[] calls;
        uint256 nonce;
        uint256 deadline;
        bytes signature;
        string description;
    }

    function run(string calldata json) external {
        Action memory a = parseAction(json);
        bytes32 digest = preflight(a);
        console2.log(string.concat("action ", vm.toString(uint256(a.id)), ": ", a.description));
        console2.log("token", a.token);
        console2.log("digest", vm.toString(digest));

        vm.startBroadcast();
        IGLDT(a.token).execute(a.calls, a.nonce, a.deadline, a.signature);
        vm.stopBroadcast();
    }

    /// @notice Reverts with the reason if the action would fail on this chain; returns its EIP-712 digest.
    function preflight(Action memory a) public view returns (bytes32 digest) {
        require(block.chainid == a.chainId, "the RPC is not the action's chain");
        require(a.token.code.length > 0, "no code at the action's token");
        require(block.timestamp <= a.deadline, "the action's deadline has passed");
        require(!IGLDT(a.token).usedNonce(a.nonce), "the action's nonce is already used or cancelled");
        digest = IGLDT(a.token).hashExecute(a.calls, a.nonce, a.deadline);
        (address signer, ECDSA.RecoverError err, ) = ECDSA.tryRecover(digest, a.signature);
        require(err == ECDSA.RecoverError.NoError, "the signature does not parse, or has a high s");
        require(signer == IGLDT(a.token).adminSigner(), "not signed by the token's adminSigner");
    }

    /// @notice Reads one SignedEvmAdminAction from `json`.
    function parseAction(string memory json) public view returns (Action memory a) {
        string memory root = ".";
        if (!vm.keyExistsJson(json, ".nonce")) {
            // dfx prints an opt as an array of zero or one element.
            require(vm.keyExistsJson(json, "$[0].nonce"), "no action in the JSON (opt is empty)");
            require(!vm.keyExistsJson(json, "$[1]"), "more than one action in the JSON");
            root = "$[0].";
        }
        a.id = uint64(_uint(json, string.concat(root, "id"), type(uint64).max));
        a.chainId = _uint(json, string.concat(root, "chain_id"), type(uint64).max);
        a.token = vm.parseJsonAddress(json, string.concat(root, "token"));
        a.nonce = _uint(json, string.concat(root, "nonce"), type(uint64).max);
        a.deadline = _uint(json, string.concat(root, "deadline"), type(uint64).max);
        a.signature = vm.parseJsonBytes(json, string.concat(root, "signature"));
        if (vm.keyExistsJson(json, string.concat(root, "description"))) {
            a.description = vm.parseJsonString(json, string.concat(root, "description"));
        }

        uint256 count;
        while (vm.keyExistsJson(json, string.concat(root, "calls[", vm.toString(count), "]"))) count++;
        a.calls = new IGLDT.Call[](count);
        for (uint256 i = 0; i < count; i++) {
            string memory call = string.concat(root, "calls[", vm.toString(i), "].");
            a.calls[i] = IGLDT.Call(
                vm.parseJsonAddress(json, string.concat(call, "target")),
                _blob(json, string.concat(call, "data"))
            );
        }
    }

    /// @dev A Candid blob: 0x hex, or the array of byte numbers dfx prints.
    function _blob(string memory json, string memory key) private pure returns (bytes memory b) {
        try vm.parseJsonBytes(json, key) returns (bytes memory hexBytes) {
            return hexBytes;
        } catch {
            uint256[] memory numbers = vm.parseJsonUintArray(json, key);
            b = new bytes(numbers.length);
            for (uint256 i = 0; i < numbers.length; i++) {
                require(numbers[i] <= type(uint8).max, string.concat(key, " has a value above 255"));
                b[i] = bytes1(uint8(numbers[i]));
            }
        }
    }

    /// @dev A Candid nat64: a JSON number or the decimal string dfx prints.
    function _uint(string memory json, string memory key, uint256 max) private pure returns (uint256 v) {
        v = vm.parseJsonUint(json, key);
        require(v <= max, string.concat(key, " is out of range"));
    }
}
