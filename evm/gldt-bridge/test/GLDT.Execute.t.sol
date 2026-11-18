// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.28;

import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { SendParam, MessagingFee } from "@layerzerolabs/oft-evm/contracts/interfaces/IOFT.sol";
import { ILayerZeroEndpointV2, Origin } from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/ILayerZeroEndpointV2.sol";
import { IMessageLibManager, SetConfigParam } from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/IMessageLibManager.sol";
import { IMessagingChannel } from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/IMessagingChannel.sol";
import { IMessageLib } from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/IMessageLib.sol";
import { Errors } from "@layerzerolabs/lz-evm-protocol-v2/contracts/libs/Errors.sol";
import { UlnConfig } from "@layerzerolabs/lz-evm-messagelib-v2/contracts/uln/UlnBase.sol";
import { SendUln302Mock } from "@layerzerolabs/test-devtools-evm-foundry/contracts/mocks/SendUln302Mock.sol";
import { ReceiveUln302Mock } from "@layerzerolabs/test-devtools-evm-foundry/contracts/mocks/ReceiveUln302Mock.sol";

import { GLDT } from "../src/GLDT.sol";
import { IGLDT } from "../src/IGLDT.sol";
import { GLDTFixture } from "./helpers/GLDTFixture.sol";

contract GLDTExecuteTest is GLDTFixture {
    address internal stranger = makeAddr("stranger");
    address internal relayer = makeAddr("relayer");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");

    uint256 internal deadline;

    function setUp() public override {
        super.setUp();
        deadline = block.timestamp + 7 days;
    }

    function test_execute_runs_self_call_and_emits_Executed() public {
        assertEq(tokenA.CALL_TYPEHASH(), keccak256("Call(address target,bytes data)"));
        assertEq(
            tokenA.EXECUTE_TYPEHASH(),
            keccak256("Execute(Call[] calls,uint256 nonce,uint256 deadline)Call(address target,bytes data)")
        );

        IGLDT.Call[] memory calls = _setMin(tokenA, 2e8);
        bytes32 digest = executeDigest(address(tokenA), calls, 5, deadline);
        // hashExecute is the full EIP-712 digest over the shared Gold Token v1 domain, the one gldt_swap signs.
        assertEq(tokenA.hashExecute(calls, 5, deadline), digest);
        bytes memory sig = signExecute(calls, 5, deadline);
        assertFalse(tokenA.usedNonce(5));

        vm.expectEmit(address(tokenA));
        emit IGLDT.MinBurnToIcpSet(2e8);
        vm.expectEmit(address(tokenA));
        emit IGLDT.Executed(5, digest);
        vm.prank(relayer); // anyone may submit
        tokenA.execute(calls, 5, deadline, sig);

        assertEq(tokenA.minBurnToIcp(), 2e8);
        assertTrue(tokenA.usedNonce(5));
        // Nonces are unordered: no other nonce is touched.
        assertFalse(tokenA.usedNonce(4));
        assertFalse(tokenA.usedNonce(6));
        // The other chain's token is untouched.
        assertFalse(tokenB.usedNonce(5));
        assertEq(tokenB.minBurnToIcp(), MIN_BURN_TO_ICP);

        // A batch of several calls runs them in order.
        IGLDT.Call[] memory batch = new IGLDT.Call[](3);
        batch[0] = IGLDT.Call(address(tokenA), abi.encodeCall(IGLDT.setMinBurnToIcp, (3e8)));
        batch[1] = IGLDT.Call(address(tokenA), abi.encodeCall(IGLDT.setPaused, (true, false)));
        batch[2] = IGLDT.Call(address(tokenA), abi.encodeCall(IGLDT.setMinBurnToIcp, (4e8)));
        assertEq(tokenA.hashExecute(batch, 6, deadline), executeDigest(address(tokenA), batch, 6, deadline));
        tokenA.execute(batch, 6, deadline, signExecute(batch, 6, deadline));
        assertEq(tokenA.minBurnToIcp(), 4e8);
        (bool lz, bool icp) = tokenA.paused();
        assertTrue(lz);
        assertFalse(icp);
    }

    function test_execute_expired_reverts_Expired() public {
        IGLDT.Call[] memory calls = _setMin(tokenA, 2e8);
        uint256 dl = block.timestamp + 1 hours;
        bytes memory sig = signExecute(calls, 1, dl);

        vm.warp(dl + 1);
        vm.expectRevert(IGLDT.Expired.selector);
        tokenA.execute(calls, 1, dl, sig);
        assertFalse(tokenA.usedNonce(1));
        assertEq(tokenA.minBurnToIcp(), MIN_BURN_TO_ICP);

        // The deadline itself is still valid.
        vm.warp(dl);
        tokenA.execute(calls, 1, dl, sig);
        assertTrue(tokenA.usedNonce(1));
        assertEq(tokenA.minBurnToIcp(), 2e8);
    }

    function test_execute_reused_nonce_reverts_NonceUsed() public {
        IGLDT.Call[] memory calls = _setMin(tokenA, 2e8);
        bytes memory sig = signExecute(calls, 5, deadline);
        tokenA.execute(calls, 5, deadline, sig);

        vm.expectRevert(IGLDT.NonceUsed.selector);
        tokenA.execute(calls, 5, deadline, sig);

        // A different action signed with the same nonce fails too.
        IGLDT.Call[] memory other = _setMin(tokenA, 3e8);
        bytes memory otherSig = signExecute(other, 5, deadline);
        vm.expectRevert(IGLDT.NonceUsed.selector);
        tokenA.execute(other, 5, deadline, otherSig);

        assertEq(tokenA.minBurnToIcp(), 2e8);
    }

    function test_execute_wrong_signer_reverts_BadSignature() public {
        IGLDT.Call[] memory calls = _setMin(tokenA, 2e8);

        // The claims key cannot sign admin actions.
        bytes memory byIcpKey = signExecute(icpKey, address(tokenA), calls, 1, deadline);
        vm.expectRevert(IGLDT.BadSignature.selector);
        tokenA.execute(calls, 1, deadline, byIcpKey);

        // Nor can any other key.
        bytes memory byStranger = signExecute(0x5EED, address(tokenA), calls, 1, deadline);
        vm.expectRevert(IGLDT.BadSignature.selector);
        tokenA.execute(calls, 1, deadline, byStranger);

        // The admin signature covers the calls, the nonce and the deadline.
        bytes memory sig = signExecute(calls, 1, deadline);
        vm.expectRevert(IGLDT.BadSignature.selector);
        tokenA.execute(_setMin(tokenA, 3e8), 1, deadline, sig);
        vm.expectRevert(IGLDT.BadSignature.selector);
        tokenA.execute(calls, 2, deadline, sig);
        vm.expectRevert(IGLDT.BadSignature.selector);
        tokenA.execute(calls, 1, deadline + 1, sig);
        // One call more or less changes the digest too.
        IGLDT.Call[] memory longer = new IGLDT.Call[](2);
        longer[0] = calls[0];
        longer[1] = calls[0];
        vm.expectRevert(IGLDT.BadSignature.selector);
        tokenA.execute(longer, 1, deadline, sig);
        vm.expectRevert(IGLDT.BadSignature.selector);
        tokenA.execute(new IGLDT.Call[](0), 1, deadline, sig);

        // A malformed signature fails in OpenZeppelin's ECDSA.
        bytes memory short = new bytes(64);
        vm.expectRevert(abi.encodeWithSelector(ECDSA.ECDSAInvalidSignatureLength.selector, 64));
        tokenA.execute(calls, 1, deadline, short);

        assertFalse(tokenA.usedNonce(1));
        assertEq(tokenA.minBurnToIcp(), MIN_BURN_TO_ICP);

        // Control: the admin signature runs.
        tokenA.execute(calls, 1, deadline, sig);
        assertEq(tokenA.minBurnToIcp(), 2e8);
    }

    function test_execute_signature_for_tokenB_fails_on_tokenA() public {
        IGLDT.Call[] memory calls = _setMin(tokenA, 2e8);

        // Same key, same calls, but the domain names tokenB.
        bytes memory forB = signExecute(adminKey, address(tokenB), calls, 1, deadline);
        vm.expectRevert(IGLDT.BadSignature.selector);
        tokenA.execute(calls, 1, deadline, forB);

        // The domain also has the chain id: a signature made for another chain fails here. The other domain is
        // built by hand, because via_ir may reuse one block.chainid read across a vm.chainId call.
        bytes32 otherDomain = keccak256(
            abi.encode(
                EIP712_DOMAIN_TYPEHASH,
                keccak256(bytes(NAME)),
                keccak256("1"),
                block.chainid + 1,
                address(tokenA)
            )
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(
            adminKey,
            keccak256(abi.encodePacked("\x19\x01", otherDomain, executeStructHash(calls, 1, deadline)))
        );
        bytes memory otherChain = abi.encodePacked(r, s, v);
        vm.expectRevert(IGLDT.BadSignature.selector);
        tokenA.execute(calls, 1, deadline, otherChain);

        assertFalse(tokenA.usedNonce(1));

        // tokenB's own action runs on tokenB only.
        IGLDT.Call[] memory callsB = _setMin(tokenB, 3e8);
        bytes memory sigB = signExecute(adminKey, address(tokenB), callsB, 1, deadline);
        vm.expectRevert(IGLDT.BadSignature.selector);
        tokenA.execute(callsB, 1, deadline, sigB);
        tokenB.execute(callsB, 1, deadline, sigB);
        assertEq(tokenB.minBurnToIcp(), 3e8);
        assertEq(tokenA.minBurnToIcp(), MIN_BURN_TO_ICP);
        assertFalse(tokenA.usedNonce(1));
    }

    function test_execute_target_rules() public {
        address ep = address(endpointA);
        uint256 nonce = 100;

        // Allowed: the token itself, any function.
        _executeOk(tokenA, _setMin(tokenA, 2e8), nonce++);
        assertEq(tokenA.minBurnToIcp(), 2e8);

        // Allowed: the endpoint with setSendLibrary and setReceiveLibrary. Back to the defaults, then explicit again.
        IGLDT.Call[] memory libs = new IGLDT.Call[](2);
        libs[0] = IGLDT.Call(
            ep,
            abi.encodeCall(IMessageLibManager.setSendLibrary, (address(tokenA), EID_B, address(0)))
        );
        libs[1] = IGLDT.Call(
            ep,
            abi.encodeCall(IMessageLibManager.setReceiveLibrary, (address(tokenA), EID_B, address(0), 0))
        );
        _executeOk(tokenA, libs, nonce++);
        assertTrue(endpointA.isDefaultSendLibrary(address(tokenA), EID_B));
        (, bool isDefault) = endpointA.getReceiveLibrary(address(tokenA), EID_B);
        assertTrue(isDefault);

        libs[0] = IGLDT.Call(ep, abi.encodeCall(IMessageLibManager.setSendLibrary, (address(tokenA), EID_B, sendLibA)));
        libs[1] = IGLDT.Call(
            ep,
            abi.encodeCall(IMessageLibManager.setReceiveLibrary, (address(tokenA), EID_B, receiveLibA, 0))
        );
        _executeOk(tokenA, libs, nonce++);
        assertFalse(endpointA.isDefaultSendLibrary(address(tokenA), EID_B));
        assertEq(endpointA.getSendLibrary(address(tokenA), EID_B), sendLibA);
        (address recvLib, bool recvDefault) = endpointA.getReceiveLibrary(address(tokenA), EID_B);
        assertEq(recvLib, receiveLibA);
        assertFalse(recvDefault);

        // Allowed: the endpoint with setConfig (the same receive ULN config again).
        IGLDT.Call[] memory cfg = new IGLDT.Call[](1);
        cfg[0] = IGLDT.Call(
            ep,
            abi.encodeCall(
                IMessageLibManager.setConfig,
                (address(tokenA), receiveLibA, initParams(EID_A, address(tokenB)).receiveConfig)
            )
        );
        _executeOk(tokenA, cfg, nonce++);

        // Allowed: the endpoint with burn. Here there is nothing to burn, so the endpoint itself rejects it,
        // which proves the call got past the allowlist (test_execute_endpoint_burn_removes_a_verified_message
        // burns a real message).
        bytes32 peer = addressToBytes32(address(tokenB));
        IGLDT.Call[] memory burnCall = new IGLDT.Call[](1);
        burnCall[0] = IGLDT.Call(
            ep,
            abi.encodeCall(IMessagingChannel.burn, (address(tokenA), EID_B, peer, 1, keccak256("payload")))
        );
        _expectExecuteRevert(
            tokenA,
            burnCall,
            nonce,
            abi.encodeWithSelector(
                IGLDT.CallFailed.selector,
                0,
                abi.encodeWithSelector(Errors.LZ_PayloadHashNotFound.selector, bytes32(0), keccak256("payload"))
            )
        );
        // The same holds for setSendLibrary to the library already set.
        libs = new IGLDT.Call[](1);
        libs[0] = IGLDT.Call(ep, abi.encodeCall(IMessageLibManager.setSendLibrary, (address(tokenA), EID_B, sendLibA)));
        _expectExecuteRevert(
            tokenA,
            libs,
            nonce,
            abi.encodeWithSelector(IGLDT.CallFailed.selector, 0, abi.encodeWithSelector(Errors.LZ_SameValue.selector))
        );

        // Not allowed. Each bad call sits at index 1 behind a good one, so the index is checked too.
        bytes[] memory badEndpointData = new bytes[](8);
        badEndpointData[0] = abi.encodeCall(ILayerZeroEndpointV2.setDelegate, (stranger));
        badEndpointData[1] = abi.encodeCall(IMessagingChannel.skip, (address(tokenA), EID_B, peer, 1));
        badEndpointData[2] = abi.encodeCall(IMessagingChannel.nilify, (address(tokenA), EID_B, peer, 1, bytes32(0)));
        badEndpointData[3] = abi.encodeCall(
            IMessageLibManager.setReceiveLibraryTimeout,
            (address(tokenA), EID_B, receiveLibA, 0)
        );
        badEndpointData[4] = abi.encodeWithSignature(
            "clear(address,(uint32,bytes32,uint64),bytes32,bytes)",
            address(tokenA),
            Origin(EID_B, peer, 1),
            bytes32(0),
            ""
        );
        badEndpointData[5] = hex"";
        badEndpointData[6] = hex"112233";
        // The selector of the message library's own setConfig, sent to the endpoint.
        badEndpointData[7] = abi.encodeCall(IMessageLib.setConfig, (address(tokenA), new SetConfigParam[](0)));
        for (uint256 i = 0; i < badEndpointData.length; i++) {
            _expectTargetNotAllowedAtIndex1(IGLDT.Call(ep, badEndpointData[i]), nonce);
        }

        // Any other address, whatever the call. Call has no value field, so no call sends ETH.
        _expectTargetNotAllowedAtIndex1(
            IGLDT.Call(sendLibA, abi.encodeCall(IMessageLib.setConfig, (address(tokenA), new SetConfigParam[](0)))),
            nonce
        );
        _expectTargetNotAllowedAtIndex1(
            IGLDT.Call(
                receiveLibA,
                abi.encodeCall(IMessageLibManager.setConfig, (address(tokenA), receiveLibA, cfgParams()))
            ),
            nonce
        );
        bytes memory setMin5 = abi.encodeCall(IGLDT.setMinBurnToIcp, (5e8));
        _expectTargetNotAllowedAtIndex1(IGLDT.Call(address(tokenB), setMin5), nonce);
        _expectTargetNotAllowedAtIndex1(IGLDT.Call(address(implA), setMin5), nonce);
        _expectTargetNotAllowedAtIndex1(IGLDT.Call(address(endpointB), libs[0].data), nonce);
        _expectTargetNotAllowedAtIndex1(IGLDT.Call(stranger, ""), nonce);
        _expectTargetNotAllowedAtIndex1(IGLDT.Call(address(0), ""), nonce);

        // Nothing from the rejected batches ran, and their nonce is still free.
        assertEq(tokenA.minBurnToIcp(), 2e8);
        assertFalse(tokenA.usedNonce(nonce));
        assertEq(endpointA.delegates(address(tokenA)), address(tokenA));

        // execute takes no ETH either.
        IGLDT.Call[] memory calls = _setMin(tokenA, 3e8);
        bytes memory sig = signExecute(calls, nonce, deadline);
        vm.deal(relayer, 1 ether);
        vm.prank(relayer);
        (bool ok, ) = address(tokenA).call{ value: 1 }(abi.encodeCall(GLDT.execute, (calls, nonce, deadline, sig)));
        assertFalse(ok);
        assertEq(address(tokenA).balance, 0);
        assertFalse(tokenA.usedNonce(nonce));
    }

    function test_execute_endpoint_burn_removes_a_verified_message() public {
        // Two messages A to B. Both are verified on B; only the second one is delivered.
        mintByClaim(tokenA, 1, alice, 10e8);
        vm.deal(alice, 1 ether);
        _send(tokenA, EID_B, alice, bob, 1e8);
        _send(tokenA, EID_B, alice, bob, 2e8);
        (bytes memory first, ) = verifyNextPacket(EID_B, address(tokenB));
        (bytes memory second, ) = verifyNextPacket(EID_B, address(tokenB));
        (Origin memory o1, , bytes32 guid1, bytes memory msg1) = this.decodePacket(first);
        (Origin memory o2, address receiver, bytes32 guid2, bytes memory msg2) = this.decodePacket(second);
        endpointB.lzReceive(o2, receiver, guid2, msg2, "");
        assertEq(tokenB.balanceOf(bob), 2e8);

        bytes32 payloadHash = keccak256(abi.encodePacked(guid1, msg1));
        assertEq(endpointB.inboundPayloadHash(address(tokenB), o1.srcEid, o1.sender, o1.nonce), payloadHash);

        // An SNS action burns the first message for good.
        IGLDT.Call[] memory calls = new IGLDT.Call[](1);
        calls[0] = IGLDT.Call(
            address(endpointB),
            abi.encodeCall(IMessagingChannel.burn, (address(tokenB), o1.srcEid, o1.sender, o1.nonce, payloadHash))
        );
        executeAsAdmin(tokenB, calls, 1);

        assertEq(endpointB.inboundPayloadHash(address(tokenB), o1.srcEid, o1.sender, o1.nonce), bytes32(0));
        vm.expectRevert(abi.encodeWithSelector(Errors.LZ_PayloadHashNotFound.selector, bytes32(0), payloadHash));
        endpointB.lzReceive(o1, receiver, guid1, msg1, "");
        assertEq(tokenB.balanceOf(bob), 2e8);
    }

    function test_failing_inner_call_reverts_batch_and_keeps_nonce_unused() public {
        IGLDT.Call[] memory calls = new IGLDT.Call[](2);
        calls[0] = IGLDT.Call(address(tokenA), abi.encodeCall(IGLDT.setMinBurnToIcp, (3e8)));
        calls[1] = IGLDT.Call(address(tokenA), abi.encodeCall(IGLDT.setMinBurnToIcp, (0)));
        bytes memory sig = signExecute(calls, 9, deadline);

        vm.expectRevert(
            abi.encodeWithSelector(IGLDT.CallFailed.selector, 1, abi.encodeWithSelector(IGLDT.ZeroMinBurn.selector))
        );
        tokenA.execute(calls, 9, deadline, sig);

        // The first call is undone too, and the nonce is still free.
        assertEq(tokenA.minBurnToIcp(), MIN_BURN_TO_ICP);
        assertFalse(tokenA.usedNonce(9));

        // Too little gas cannot burn an action either: the batch reverts and the nonce stays unused.
        // execute spends about 43,000 gas before the call and this setConfig needs about 31,000, so with 60,000
        // the inner call runs out of gas.
        IGLDT.Call[] memory heavy = new IGLDT.Call[](1);
        heavy[0] = IGLDT.Call(
            address(endpointA),
            abi.encodeCall(IMessageLibManager.setConfig, (address(tokenA), receiveLibA, cfgParams()))
        );
        bytes memory heavySig = signExecute(heavy, 10, deadline);
        vm.prank(relayer);
        (bool ok, bytes memory ret) = address(tokenA).call{ gas: 60_000 }(
            abi.encodeCall(GLDT.execute, (heavy, 10, deadline, heavySig))
        );
        assertFalse(ok);
        assertEq(ret, abi.encodeWithSelector(IGLDT.CallFailed.selector, 0, ""));
        assertFalse(tokenA.usedNonce(10));

        // With enough gas the same signed action runs.
        vm.prank(relayer);
        tokenA.execute(heavy, 10, deadline, heavySig);
        assertTrue(tokenA.usedNonce(10));
    }

    function test_execute_cannot_reenter_with_the_same_nonce() public {
        // A signed action whose only call is execute of itself: the nonce is already used when the call runs.
        IGLDT.Call[] memory inner = _setMin(tokenA, 2e8);
        bytes memory innerSig = signExecute(inner, 7, deadline);
        IGLDT.Call[] memory outer = selfCall(tokenA, abi.encodeCall(GLDT.execute, (inner, 7, deadline, innerSig)));
        bytes memory outerSig = signExecute(outer, 7, deadline);

        vm.expectRevert(
            abi.encodeWithSelector(IGLDT.CallFailed.selector, 0, abi.encodeWithSelector(IGLDT.NonceUsed.selector))
        );
        tokenA.execute(outer, 7, deadline, outerSig);
        assertFalse(tokenA.usedNonce(7));
        assertEq(tokenA.minBurnToIcp(), MIN_BURN_TO_ICP);

        // A nested action with its own nonce and its own admin signature is just another action.
        bytes memory inner8 = signExecute(inner, 8, deadline);
        IGLDT.Call[] memory outer7 = selfCall(tokenA, abi.encodeCall(GLDT.execute, (inner, 8, deadline, inner8)));
        tokenA.execute(outer7, 7, deadline, signExecute(outer7, 7, deadline));
        assertTrue(tokenA.usedNonce(7));
        assertTrue(tokenA.usedNonce(8));
        assertEq(tokenA.minBurnToIcp(), 2e8);
    }

    function test_cancelNonce_only_via_execute() public {
        // Called directly it reverts, whoever calls.
        address[3] memory callers = [stranger, operator, vm.addr(adminKey)];
        for (uint256 i = 0; i < callers.length; i++) {
            vm.prank(callers[i]);
            vm.expectRevert(IGLDT.NotSelf.selector);
            tokenA.cancelNonce(11);
        }
        assertFalse(tokenA.usedNonce(11));

        // An action signed for nonce 11 and not submitted yet.
        IGLDT.Call[] memory pending = _setMin(tokenA, 5e8);
        bytes memory pendingSig = signExecute(pending, 11, deadline);

        // Action 10 cancels it.
        IGLDT.Call[] memory cancel = selfCall(tokenA, abi.encodeCall(IGLDT.cancelNonce, (11)));
        vm.expectEmit(address(tokenA));
        emit IGLDT.NonceCancelled(11);
        vm.expectEmit(address(tokenA));
        emit IGLDT.Executed(10, executeDigest(address(tokenA), cancel, 10, deadline));
        tokenA.execute(cancel, 10, deadline, signExecute(cancel, 10, deadline));
        assertTrue(tokenA.usedNonce(10));
        assertTrue(tokenA.usedNonce(11));

        vm.expectRevert(IGLDT.NonceUsed.selector);
        tokenA.execute(pending, 11, deadline, pendingSig);
        assertEq(tokenA.minBurnToIcp(), MIN_BURN_TO_ICP);

        // Cancelling a nonce already used or cancelled fails, so NonceCancelled always means a live action died.
        IGLDT.Call[] memory again = selfCall(tokenA, abi.encodeCall(IGLDT.cancelNonce, (11)));
        _expectExecuteRevert(
            tokenA,
            again,
            12,
            abi.encodeWithSelector(IGLDT.CallFailed.selector, 0, abi.encodeWithSelector(IGLDT.NonceUsed.selector))
        );
        assertFalse(tokenA.usedNonce(12));
    }

    function test_self_only_setters_revert_for_operator_and_strangers() public {
        bytes[6] memory calls = [
            abi.encodeCall(IGLDT.setOperator, (stranger)),
            abi.encodeCall(IGLDT.setIcpSigner, (stranger)),
            abi.encodeCall(IGLDT.setAdminSigner, (stranger)),
            abi.encodeCall(IGLDT.setMinBurnToIcp, (5e8)),
            abi.encodeCall(IGLDT.upgradeExact, (address(implA), address(implA).codehash)),
            abi.encodeCall(IGLDT.cancelNonce, (1))
        ];
        address[4] memory callers = [operator, stranger, vm.addr(adminKey), vm.addr(icpKey)];
        for (uint256 c = 0; c < callers.length; c++) {
            for (uint256 i = 0; i < calls.length; i++) {
                vm.prank(callers[c]);
                (bool ok, bytes memory ret) = address(tokenA).call(calls[i]);
                assertFalse(ok);
                assertEq(ret, abi.encodeWithSelector(IGLDT.NotSelf.selector));
            }
        }

        assertEq(tokenA.operator(), operator);
        assertEq(tokenA.icpSigner(), vm.addr(icpKey));
        assertEq(tokenA.adminSigner(), vm.addr(adminKey));
        assertEq(tokenA.minBurnToIcp(), MIN_BURN_TO_ICP);
        assertFalse(tokenA.usedNonce(1));
    }

    function test_setOperator_zero_removes_operator() public {
        vm.expectEmit(address(tokenA));
        emit IGLDT.OperatorSet(address(0));
        executeAsAdmin(tokenA, selfCall(tokenA, abi.encodeCall(IGLDT.setOperator, (address(0)))), 1);
        assertEq(tokenA.operator(), address(0));

        // The old operator lost both powers.
        vm.startPrank(operator);
        vm.expectRevert(IGLDT.NotOperator.selector);
        tokenA.pause(true, true);
        vm.expectRevert(IGLDT.NotOperator.selector);
        tokenA.setLzReceiveGas(EID_B, 200_000);
        vm.stopPrank();

        // The token itself still pauses, through execute.
        executeAsAdmin(tokenA, selfCall(tokenA, abi.encodeCall(IGLDT.setPaused, (true, false))), 2);
        (bool lz, ) = tokenA.paused();
        assertTrue(lz);

        // A new operator can be named later.
        address newOperator = makeAddr("newOperator");
        vm.expectEmit(address(tokenA));
        emit IGLDT.OperatorSet(newOperator);
        executeAsAdmin(tokenA, selfCall(tokenA, abi.encodeCall(IGLDT.setOperator, (newOperator))), 3);
        vm.prank(newOperator);
        tokenA.pause(false, true);
        (bool lzAfter, bool icpAfter) = tokenA.paused();
        assertTrue(lzAfter, "the new operator can't clear the voted pause");
        assertTrue(icpAfter);

        // tokenB keeps its operator.
        assertEq(tokenB.operator(), operator);
    }

    function test_setAdminSigner_moves_control() public {
        uint256 newKey = 0xBEEF;
        // Zero would lock execute forever, so it is rejected.
        _expectExecuteRevert(
            tokenA,
            selfCall(tokenA, abi.encodeCall(IGLDT.setAdminSigner, (address(0)))),
            1,
            abi.encodeWithSelector(IGLDT.CallFailed.selector, 0, abi.encodeWithSelector(IGLDT.ZeroAddress.selector))
        );

        vm.expectEmit(address(tokenA));
        emit IGLDT.AdminSignerSet(vm.addr(newKey));
        executeAsAdmin(tokenA, selfCall(tokenA, abi.encodeCall(IGLDT.setAdminSigner, (vm.addr(newKey)))), 1);
        assertEq(tokenA.adminSigner(), vm.addr(newKey));
        (, , , address admin, ) = tokenA.bridgeInfo();
        assertEq(admin, vm.addr(newKey));

        // The old key no longer controls the token; the new key does.
        IGLDT.Call[] memory calls = _setMin(tokenA, 2e8);
        bytes memory oldSig = signExecute(calls, 2, deadline);
        vm.expectRevert(IGLDT.BadSignature.selector);
        tokenA.execute(calls, 2, deadline, oldSig);
        tokenA.execute(calls, 2, deadline, signExecute(newKey, address(tokenA), calls, 2, deadline));
        assertEq(tokenA.minBurnToIcp(), 2e8);

        // tokenB still follows the old key.
        assertEq(tokenB.adminSigner(), vm.addr(adminKey));
    }

    function test_setIcpSigner_moves_vouchers() public {
        uint256 newKey = 0xC1A1;
        _expectExecuteRevert(
            tokenA,
            selfCall(tokenA, abi.encodeCall(IGLDT.setIcpSigner, (address(0)))),
            1,
            abi.encodeWithSelector(IGLDT.CallFailed.selector, 0, abi.encodeWithSelector(IGLDT.ZeroAddress.selector))
        );

        vm.expectEmit(address(tokenA));
        emit IGLDT.IcpSignerSet(vm.addr(newKey));
        executeAsAdmin(tokenA, selfCall(tokenA, abi.encodeCall(IGLDT.setIcpSigner, (vm.addr(newKey)))), 1);
        assertEq(tokenA.icpSigner(), vm.addr(newKey));

        // Vouchers from the old claims key stop working; the new key's vouchers mint.
        bytes memory oldVoucher = signClaim(icpKey, address(tokenA), 3, bob, 1e8);
        vm.expectRevert(IGLDT.BadSignature.selector);
        tokenA.claimFromIcp(3, bob, 1e8, oldVoucher);
        tokenA.claimFromIcp(3, bob, 1e8, signClaim(newKey, address(tokenA), 3, bob, 1e8));
        assertEq(tokenA.balanceOf(bob), 1e8);
    }

    function test_endpoint_setConfig_through_execute_changes_dvns() public {
        // New receive DVNs on B for messages from A, plus new confirmations, in one SNS action.
        address[] memory newDvns = _deployDvnPair(EID_B, EID_A, sendLibB, receiveLibB);
        UlnConfig memory uln = UlnConfig({
            confirmations: 20,
            requiredDVNCount: 2,
            optionalDVNCount: NIL_DVN_COUNT,
            optionalDVNThreshold: 0,
            requiredDVNs: newDvns,
            optionalDVNs: new address[](0)
        });
        SetConfigParam[] memory params = new SetConfigParam[](1);
        params[0] = SetConfigParam(EID_A, CONFIG_TYPE_ULN, abi.encode(uln));

        IGLDT.Call[] memory calls = new IGLDT.Call[](2);
        calls[0] = IGLDT.Call(
            address(endpointB),
            abi.encodeCall(IMessageLibManager.setConfig, (address(tokenB), receiveLibB, params))
        );
        calls[1] = IGLDT.Call(address(tokenB), abi.encodeCall(IGLDT.setMinBurnToIcp, (2e8)));
        executeAsAdmin(tokenB, calls, 1);

        UlnConfig memory got = abi.decode(
            endpointB.getConfig(address(tokenB), receiveLibB, EID_A, CONFIG_TYPE_ULN),
            (UlnConfig)
        );
        assertEq(got.requiredDVNs, newDvns);
        assertEq(got.confirmations, 20);
        assertEq(got.requiredDVNCount, 2);
        assertEq(got.optionalDVNCount, 0);
        assertEq(ReceiveUln302Mock(receiveLibB).getAppUlnConfig(address(tokenB), EID_A).requiredDVNs, newDvns);
        assertTrue(newDvns[0] != dvnsB[0] && newDvns[0] != dvnsB[1]);
        assertEq(tokenB.minBurnToIcp(), 2e8);

        // The send side and the other chain are unchanged.
        UlnConfig memory sendSide = abi.decode(
            endpointB.getConfig(address(tokenB), sendLibB, EID_A, CONFIG_TYPE_ULN),
            (UlnConfig)
        );
        assertEq(sendSide.requiredDVNs, dvnsB);
        assertEq(SendUln302Mock(payable(sendLibA)).getAppUlnConfig(address(tokenA), EID_B).requiredDVNs, dvnsA);

        // A message from A now needs the new DVNs: the fixture verifies with whatever the receive config names.
        mintByClaim(tokenA, 1, alice, 5e8);
        vm.deal(alice, 1 ether);
        _send(tokenA, EID_B, alice, bob, 5e8);
        deliverPackets(EID_B, address(tokenB));
        assertEq(tokenB.balanceOf(bob), 5e8);
    }

    // Helpers

    function cfgParams() internal view returns (SetConfigParam[] memory) {
        return initParams(EID_A, address(tokenB)).receiveConfig;
    }

    function _setMin(GLDT token, uint256 amount) private pure returns (IGLDT.Call[] memory) {
        return selfCall(token, abi.encodeCall(IGLDT.setMinBurnToIcp, (amount)));
    }

    function _executeOk(GLDT token, IGLDT.Call[] memory calls, uint256 nonce) private {
        bytes32 digest = executeDigest(address(token), calls, nonce, deadline);
        vm.expectEmit(address(token));
        emit IGLDT.Executed(nonce, digest);
        vm.prank(relayer);
        token.execute(calls, nonce, deadline, signExecute(adminKey, address(token), calls, nonce, deadline));
        assertTrue(token.usedNonce(nonce));
    }

    function _expectExecuteRevert(GLDT token, IGLDT.Call[] memory calls, uint256 nonce, bytes memory reason) private {
        bytes memory sig = signExecute(adminKey, address(token), calls, nonce, deadline);
        vm.expectRevert(reason);
        token.execute(calls, nonce, deadline, sig);
        assertFalse(token.usedNonce(nonce));
    }

    function _expectTargetNotAllowedAtIndex1(IGLDT.Call memory bad, uint256 nonce) private {
        IGLDT.Call[] memory calls = new IGLDT.Call[](2);
        calls[0] = IGLDT.Call(address(tokenA), abi.encodeCall(IGLDT.setMinBurnToIcp, (9e8)));
        calls[1] = bad;
        _expectExecuteRevert(tokenA, calls, nonce, abi.encodeWithSelector(IGLDT.TargetNotAllowed.selector, 1));
    }

    function _send(GLDT token, uint32 dstEid, address from, address to, uint256 amount) private {
        SendParam memory sp = SendParam({
            dstEid: dstEid,
            to: addressToBytes32(to),
            amountLD: amount,
            minAmountLD: amount,
            extraOptions: "",
            composeMsg: "",
            oftCmd: ""
        });
        MessagingFee memory fee = token.quoteSend(sp, false);
        vm.prank(from);
        token.send{ value: fee.nativeFee }(sp, fee, from);
    }
}
