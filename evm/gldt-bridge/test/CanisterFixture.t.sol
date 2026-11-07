// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.28;

import { GLDT } from "../src/GLDT.sol";
import { IGLDT } from "../src/IGLDT.sol";
import { GLDTFixture } from "./helpers/GLDTFixture.sol";

/// @notice Checks what the gldt_swap canister signed in PocketIC against the contract: its two test key addresses
/// as the token's signers, a claim voucher and a signed SetMinBurnToIcp(200_000_000) admin action. The file comes
/// from the PocketIC test `write_canister_fixture` (backend/integration_tests/src/gldt_swap_suite/bridge/fixtures.rs),
/// for Foundry's default chain id 31337, so this test never calls vm.chainId.
contract CanisterFixtureTest is GLDTFixture {
    address internal constant CANISTER_TOKEN = 0x00000000000000000000000000000000000B1d6E;

    string internal json;
    GLDT internal token;

    function setUp() public override {
        super.setUp();
        json = vm.readFile(string.concat(vm.projectRoot(), "/test/fixtures/canister_signed.json"));

        // The token at the fixture's address, with the canister's addresses as its two signers.
        IGLDT.InitParams memory p = initParams(EID_A, address(tokenB));
        p.adminSigner = vm.parseJsonAddress(json, ".adminSigner");
        p.icpSigner = vm.parseJsonAddress(json, ".claimsSigner");
        token = deployTokenAt(CANISTER_TOKEN, address(implA), p);
    }

    function test_canister_signed_voucher_and_action_work() public {
        // The environment the file was written for.
        assertEq(block.chainid, 31337);
        assertEq(vm.parseJsonUint(json, ".chainId"), block.chainid);
        assertEq(vm.parseJsonAddress(json, ".token"), CANISTER_TOKEN);
        assertTrue(token.adminSigner() != token.icpSigner());

        // The voucher mints.
        uint256 rawIndex = vm.parseJsonUint(json, ".voucher.icpBurnIndex");
        assertLe(rawIndex, type(uint64).max);
        uint64 index = uint64(rawIndex);
        address to = vm.parseJsonAddress(json, ".voucher.recipient");
        uint256 amount = vm.parseJsonUint(json, ".voucher.amount");
        bytes memory voucherSignature = vm.parseJsonBytes(json, ".voucher.signature");
        assertEq(token.balanceOf(to), 0);
        vm.expectEmit(address(token));
        emit IGLDT.ClaimedFromIcp(index, to, amount);
        token.claimFromIcp(index, to, amount, voucherSignature);
        assertTrue(token.isClaimed(index));
        assertEq(token.balanceOf(to), amount);
        assertEq(token.totalSupply(), amount);

        // The admin action is one self call to setMinBurnToIcp(2e8), and execute runs it.
        assertFalse(vm.keyExistsJson(json, ".adminAction.calls[1]"));
        IGLDT.Call[] memory calls = new IGLDT.Call[](1);
        calls[0] = IGLDT.Call(
            vm.parseJsonAddress(json, ".adminAction.calls[0].target"),
            vm.parseJsonBytes(json, ".adminAction.calls[0].data")
        );
        assertEq(calls[0].target, CANISTER_TOKEN);
        assertEq(calls[0].data, abi.encodeCall(IGLDT.setMinBurnToIcp, (200_000_000)));
        uint256 nonce = vm.parseJsonUint(json, ".adminAction.nonce");
        uint256 deadline = vm.parseJsonUint(json, ".adminAction.deadline");
        bytes memory actionSignature = vm.parseJsonBytes(json, ".adminAction.signature");
        assertGe(deadline, block.timestamp);

        assertEq(token.minBurnToIcp(), 100_000_000);
        assertFalse(token.usedNonce(nonce));
        vm.expectEmit(address(token));
        emit IGLDT.Executed(nonce, token.hashExecute(calls, nonce, deadline));
        token.execute(calls, nonce, deadline, actionSignature);
        assertTrue(token.usedNonce(nonce));
        assertEq(token.minBurnToIcp(), 200_000_000);
    }
}
