// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.28;

import { Script, console2 } from "forge-std/Script.sol";
import { ILayerZeroEndpointV2, Origin } from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/ILayerZeroEndpointV2.sol";
import { PacketV1Codec } from "@layerzerolabs/lz-evm-protocol-v2/contracts/messagelib/libs/PacketV1Codec.sol";

import { GLDT } from "../src/GLDT.sol";

/// @notice Delivers a LayerZero message that the endpoint holds for GLDT, for example one rejected while lzPaused.
/// LayerZero's executor does not retry on its own, and anyone may call endpoint.lzReceive. Run it on
/// the destination chain, after the unpause, with either the encoded packet from the source chain's PacketSent
/// event, or the message's parts (LayerZero Scan shows them):
///
///   forge script script/ReplayLzMessage.s.sol --sig 'run(bytes)' <encodedPayload of PacketSent> \
///     --rpc-url <destination url> --account <keystore> --sender <address> --broadcast
///   forge script script/ReplayLzMessage.s.sol --sig 'run(address,uint32,bytes32,uint64,bytes32,bytes)' \
///     <token> <srcEid> <sender as bytes32> <nonce> <guid> <message> --rpc-url ... --broadcast
contract ReplayLzMessage is Script {
    using PacketV1Codec for bytes;

    function run(bytes calldata packet) external {
        address receiver = packet.receiverB20();
        require(packet.dstEid() == GLDT(receiver).endpoint().eid(), "the packet is for another chain");
        _replay(receiver, Origin(packet.srcEid(), packet.sender(), packet.nonce()), packet.guid(), packet.message());
    }

    function run(
        address receiver,
        uint32 srcEid,
        bytes32 sender,
        uint64 nonce,
        bytes32 guid,
        bytes calldata message
    ) external {
        _replay(receiver, Origin(srcEid, sender, nonce), guid, message);
    }

    /// @notice Reverts with the reason if the endpoint would not deliver this message to `receiver` now.
    function preflight(
        address receiver,
        Origin memory origin,
        bytes32 guid,
        bytes memory message
    ) public view returns (ILayerZeroEndpointV2 endpoint) {
        endpoint = GLDT(receiver).endpoint();
        bytes32 held = endpoint.inboundPayloadHash(receiver, origin.srcEid, origin.sender, origin.nonce);
        require(held != bytes32(0), "the endpoint holds nothing at this nonce: delivered already, or not verified yet");
        require(held == keccak256(abi.encodePacked(guid, message)), "the guid or message differ from the held message");
        (bool lzPaused, ) = GLDT(receiver).paused();
        require(!lzPaused, "the token is still lzPaused: unpause it first");
    }

    function _replay(address receiver, Origin memory origin, bytes32 guid, bytes memory message) private {
        ILayerZeroEndpointV2 endpoint = preflight(receiver, origin, guid, message);
        console2.log("receiver", receiver);
        console2.log("srcEid", uint256(origin.srcEid));
        console2.log("nonce", uint256(origin.nonce));
        console2.log("guid", vm.toString(guid));

        vm.startBroadcast();
        // GLDT ignores extraData, and the executor passes none for a plain OFT send.
        endpoint.lzReceive(origin, receiver, guid, message, "");
        vm.stopBroadcast();
    }
}
