// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.28;

import { SendParam, MessagingFee, MessagingReceipt } from "@layerzerolabs/oft-evm/contracts/interfaces/IOFT.sol";
import { Origin } from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/ILayerZeroEndpointV2.sol";
import { Errors } from "@layerzerolabs/lz-evm-protocol-v2/contracts/libs/Errors.sol";

import { GLDT } from "../src/GLDT.sol";
import { IGLDT } from "../src/IGLDT.sol";
import { GLDTFixture } from "./helpers/GLDTFixture.sol";

contract GLDTLzTest is GLDTFixture {
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal stranger = makeAddr("stranger");

    function setUp() public override {
        super.setUp();
        mintByClaim(tokenA, 1, alice, 10e8);
        vm.deal(alice, 1 ether);
        vm.deal(bob, 1 ether);
    }

    function test_send_A_to_B_moves_supply() public {
        _send(tokenA, EID_B, alice, bob, 4e8);

        // Burned on A at once, nothing on B until the message is verified and delivered.
        assertEq(tokenA.balanceOf(alice), 6e8);
        assertEq(tokenA.totalSupply(), 6e8);
        assertEq(tokenB.totalSupply(), 0);

        deliverPackets(EID_B, address(tokenB));
        assertEq(tokenB.balanceOf(bob), 4e8);
        assertEq(tokenB.totalSupply(), 4e8);
        assertEq(tokenA.totalSupply() + tokenB.totalSupply(), 10e8);

        // And back from B to A.
        _send(tokenB, EID_A, bob, alice, 1e8);
        deliverPackets(EID_A, address(tokenA));
        assertEq(tokenA.balanceOf(alice), 7e8);
        assertEq(tokenB.balanceOf(bob), 3e8);
        assertEq(tokenA.totalSupply() + tokenB.totalSupply(), 10e8);
    }

    function test_send_reverts_while_lzPaused() public {
        vm.prank(operator);
        tokenA.pause(true, false);

        SendParam memory sp = _sendParam(EID_B, bob, 4e8);
        MessagingFee memory fee = tokenA.quoteSend(sp, false);
        vm.prank(alice);
        vm.expectRevert(IGLDT.PathPaused.selector);
        tokenA.send{ value: fee.nativeFee }(sp, fee, alice);

        assertEq(tokenA.balanceOf(alice), 10e8);
        assertEq(tokenA.totalSupply(), 10e8);
        // forge-lint: disable-next-line(unsafe-typecast)
        assertFalse(hasPendingPackets(uint16(EID_B), addressToBytes32(address(tokenB))));

        // icpBridgePaused alone leaves LayerZero open. Only the token itself turns a pause off.
        vm.prank(address(tokenA));
        tokenA.setPaused(false, true);
        _send(tokenA, EID_B, alice, bob, 4e8);
        deliverPackets(EID_B, address(tokenB));
        assertEq(tokenB.balanceOf(bob), 4e8);
    }

    function test_receive_while_paused_is_held_then_replayed() public {
        vm.prank(operator);
        tokenB.pause(true, false);

        _send(tokenA, EID_B, alice, bob, 4e8);
        (bytes memory packet, bytes memory options) = verifyNextPacket(EID_B, address(tokenB));
        (Origin memory origin, address receiver, bytes32 guid, bytes memory message) = this.decodePacket(packet);
        bytes32 payloadHash = keccak256(abi.encodePacked(guid, message));
        assertEq(receiver, address(tokenB));
        assertEq(_heldPayloadHash(origin), payloadHash);

        // The executor delivers with the enforced gas, and the token rejects the message while paused.
        (uint256 gas, ) = _parseExecutorLzReceiveOption(options);
        assertEq(gas, LZ_RECEIVE_GAS);
        vm.prank(executorB);
        vm.expectRevert(IGLDT.PathPaused.selector);
        endpointB.lzReceive{ gas: gas }(origin, receiver, guid, message, "");

        // Held: still verified at the endpoint, nothing minted, and A's burn stands.
        assertEq(_heldPayloadHash(origin), payloadHash);
        assertEq(tokenB.totalSupply(), 0);
        assertEq(tokenB.balanceOf(bob), 0);
        assertEq(tokenA.totalSupply(), 6e8);

        // A replay before the unpause is rejected the same way.
        vm.prank(stranger);
        vm.expectRevert(IGLDT.PathPaused.selector);
        endpointB.lzReceive(origin, receiver, guid, message, "");

        // After the unpause anyone can replay it, and the balance arrives.
        vm.prank(address(tokenB));
        tokenB.setPaused(false, false);
        vm.prank(stranger);
        endpointB.lzReceive(origin, receiver, guid, message, "");
        assertEq(tokenB.balanceOf(bob), 4e8);
        assertEq(tokenB.totalSupply(), 4e8);
        assertEq(_heldPayloadHash(origin), bytes32(0));

        // It cannot be delivered twice.
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(Errors.LZ_PayloadHashNotFound.selector, bytes32(0), payloadHash));
        endpointB.lzReceive(origin, receiver, guid, message, "");
        assertEq(tokenB.totalSupply(), 4e8);
    }

    function _sendParam(uint32 dstEid, address to, uint256 amount) private pure returns (SendParam memory) {
        return
            SendParam({
                dstEid: dstEid,
                to: addressToBytes32(to),
                amountLD: amount,
                minAmountLD: amount,
                extraOptions: "",
                composeMsg: "",
                oftCmd: ""
            });
    }

    function _send(
        GLDT token,
        uint32 dstEid,
        address from,
        address to,
        uint256 amount
    ) private returns (MessagingReceipt memory receipt) {
        SendParam memory sp = _sendParam(dstEid, to, amount);
        MessagingFee memory fee = token.quoteSend(sp, false);
        vm.prank(from);
        (receipt, ) = token.send{ value: fee.nativeFee }(sp, fee, from);
    }

    function _heldPayloadHash(Origin memory origin) private view returns (bytes32) {
        return endpointB.inboundPayloadHash(address(tokenB), origin.srcEid, origin.sender, origin.nonce);
    }
}
