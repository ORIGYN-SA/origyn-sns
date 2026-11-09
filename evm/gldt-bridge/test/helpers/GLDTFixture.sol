// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.28;

import { TestHelperOz5 } from "@layerzerolabs/test-devtools-evm-foundry/contracts/TestHelperOz5.sol";
import { EndpointV2Mock } from "@layerzerolabs/test-devtools-evm-foundry/contracts/mocks/EndpointV2Mock.sol";
import { SendUln302Mock } from "@layerzerolabs/test-devtools-evm-foundry/contracts/mocks/SendUln302Mock.sol";
import { ReceiveUln302Mock } from "@layerzerolabs/test-devtools-evm-foundry/contracts/mocks/ReceiveUln302Mock.sol";
import { DVNMock } from "@layerzerolabs/test-devtools-evm-foundry/contracts/mocks/DVNMock.sol";
import { DVNFeeLibMock } from "@layerzerolabs/test-devtools-evm-foundry/contracts/mocks/DVNFeeLibMock.sol";
import { IDVN } from "@layerzerolabs/lz-evm-messagelib-v2/contracts/uln/interfaces/IDVN.sol";
import { UlnConfig } from "@layerzerolabs/lz-evm-messagelib-v2/contracts/uln/UlnBase.sol";
import { ExecutorConfig } from "@layerzerolabs/lz-evm-messagelib-v2/contracts/SendLibBase.sol";
import { SetConfigParam } from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/IMessageLibManager.sol";
import { Origin } from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/ILayerZeroEndpointV2.sol";
import { PacketV1Codec } from "@layerzerolabs/lz-evm-protocol-v2/contracts/messagelib/libs/PacketV1Codec.sol";
import { DoubleEndedQueue } from "@openzeppelin/contracts/utils/structs/DoubleEndedQueue.sol";
import { ERC1967Proxy } from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import { GLDT } from "../../src/GLDT.sol";
import { IGLDT } from "../../src/IGLDT.sol";

/// @notice Two LayerZero test endpoints (EIDs 1 and 2) with ULN302, two required DVNs per chain and
/// every LayerZero field set explicitly, plus one GLDT proxy per endpoint, peered to each other.
abstract contract GLDTFixture is TestHelperOz5 {
    using DoubleEndedQueue for DoubleEndedQueue.Bytes32Deque;
    using PacketV1Codec for bytes;

    uint32 internal constant EID_A = 1;
    uint32 internal constant EID_B = 2;
    uint32 internal constant CONFIG_TYPE_EXECUTOR = 1;
    uint32 internal constant CONFIG_TYPE_ULN = 2;
    uint8 internal constant NIL_DVN_COUNT = type(uint8).max;

    // These differ from the TestHelperOz5 defaults (100 confirmations, 10_000 bytes, one DVN),
    // so reading them back proves the initializer set them.
    uint64 internal constant CONFIRMATIONS = 15;
    uint32 internal constant MAX_MESSAGE_SIZE = 4_096;
    uint128 internal constant LZ_RECEIVE_GAS = 100_000;
    uint256 internal constant MIN_BURN_TO_ICP = 100_000_000;

    string internal constant NAME = "Gold Token";
    string internal constant SYMBOL = "GLDT";

    bytes32 internal constant EIP712_DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");

    uint256 internal adminKey = 0xAD1A;
    uint256 internal icpKey = 0x1C9;
    address internal operator = makeAddr("operator");

    EndpointV2Mock internal endpointA;
    EndpointV2Mock internal endpointB;
    address internal sendLibA;
    address internal receiveLibA;
    address internal sendLibB;
    address internal receiveLibB;
    address internal executorA;
    address internal executorB;
    /// @dev The two required DVNs on each chain, sorted ascending as ULN302 requires.
    address[] internal dvnsA;
    address[] internal dvnsB;

    GLDT internal implA;
    GLDT internal implB;
    GLDT internal tokenA;
    GLDT internal tokenB;

    function setUp() public virtual override {
        super.setUp();
        setUpEndpoints(2, LibraryType.UltraLightNode);

        endpointA = EndpointV2Mock(endpoints[EID_A]);
        endpointB = EndpointV2Mock(endpoints[EID_B]);
        sendLibA = endpointSetup.sendLibs[0];
        receiveLibA = endpointSetup.receiveLibs[0];
        sendLibB = endpointSetup.sendLibs[1];
        receiveLibB = endpointSetup.receiveLibs[1];
        // The helper keeps only the last chain's executor, so read each one from its default config.
        executorA = SendUln302Mock(payable(sendLibA)).getExecutorConfig(address(0), EID_B).executor;
        executorB = SendUln302Mock(payable(sendLibB)).getExecutorConfig(address(0), EID_A).executor;
        dvnsA = _deployDvnPair(EID_A, EID_B, sendLibA, receiveLibA);
        dvnsB = _deployDvnPair(EID_B, EID_A, sendLibB, receiveLibB);

        implA = new GLDT(address(endpointA));
        implB = new GLDT(address(endpointB));

        // Fixed addresses, so each initializer can name the other token as its peer.
        address addrA = makeAddr("tokenA");
        address addrB = makeAddr("tokenB");
        tokenA = deployTokenAt(addrA, address(implA), initParams(EID_A, addrB));
        tokenB = deployTokenAt(addrB, address(implB), initParams(EID_B, addrA));
    }

    /// @notice InitParams for the token on `localEid`, peered to `peerToken` on the other endpoint.
    function initParams(uint32 localEid, address peerToken) internal view returns (IGLDT.InitParams memory p) {
        bool onA = localEid == EID_A;
        uint32 peerEid = onA ? EID_B : EID_A;
        address sendLib = onA ? sendLibA : sendLibB;
        address receiveLib = onA ? receiveLibA : receiveLibB;

        UlnConfig memory uln = UlnConfig({
            confirmations: CONFIRMATIONS,
            requiredDVNCount: 2,
            optionalDVNCount: NIL_DVN_COUNT,
            optionalDVNThreshold: 0,
            requiredDVNs: onA ? dvnsA : dvnsB,
            optionalDVNs: new address[](0)
        });

        SetConfigParam[] memory sendConfig = new SetConfigParam[](2);
        sendConfig[0] = SetConfigParam(
            peerEid,
            CONFIG_TYPE_EXECUTOR,
            abi.encode(ExecutorConfig(MAX_MESSAGE_SIZE, onA ? executorA : executorB))
        );
        sendConfig[1] = SetConfigParam(peerEid, CONFIG_TYPE_ULN, abi.encode(uln));
        SetConfigParam[] memory receiveConfig = new SetConfigParam[](1);
        receiveConfig[0] = SetConfigParam(peerEid, CONFIG_TYPE_ULN, abi.encode(uln));

        p = IGLDT.InitParams({
            name: NAME,
            symbol: SYMBOL,
            adminSigner: vm.addr(adminKey),
            icpSigner: vm.addr(icpKey),
            operator: operator,
            peerEid: peerEid,
            peer: addressToBytes32(peerToken),
            sendLib: sendLib,
            receiveLib: receiveLib,
            sendConfig: sendConfig,
            receiveConfig: receiveConfig,
            lzReceiveGas: LZ_RECEIVE_GAS,
            minBurnToIcp: MIN_BURN_TO_ICP
        });
    }

    /// @notice Deploys a GLDT proxy with a plain CREATE. Reverts bubble up unchanged.
    function deployToken(address impl, IGLDT.InitParams memory p) internal returns (GLDT) {
        return GLDT(address(new ERC1967Proxy(impl, abi.encodeCall(GLDT.initialize, (p)))));
    }

    /// @notice Deploys a GLDT proxy at a chosen address, so its EIP-712 domain is known in advance.
    function deployTokenAt(address where, address impl, IGLDT.InitParams memory p) internal returns (GLDT) {
        deployCodeTo("ERC1967Proxy.sol:ERC1967Proxy", abi.encode(impl, abi.encodeCall(GLDT.initialize, (p))), where);
        return GLDT(where);
    }

    /// @notice The token's EIP-712 domain separator, built here and not read from the contract.
    function domainSeparator(address token) internal view returns (bytes32) {
        return
            keccak256(
                abi.encode(EIP712_DOMAIN_TYPEHASH, keccak256(bytes(NAME)), keccak256("1"), block.chainid, token)
            );
    }

    /// @notice Signs an EIP-712 struct hash for `token` and returns r, s, v (65 bytes).
    function signTyped(uint256 key, address token, bytes32 structHash) internal view returns (bytes memory) {
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator(token), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(key, digest);
        return abi.encodePacked(r, s, v);
    }

    /// @notice The voucher digest gldt_swap signs, built from the type string and not from the contract.
    function claimDigest(address token, uint64 index, address to, uint256 amount) internal view returns (bytes32) {
        return keccak256(abi.encodePacked("\x19\x01", domainSeparator(token), _claimStructHash(index, to, amount)));
    }

    /// @notice A voucher for `claimFromIcp` on `token`, signed with `key`.
    function signClaim(
        uint256 key,
        address token,
        uint64 index,
        address to,
        uint256 amount
    ) internal view returns (bytes memory) {
        return signTyped(key, token, _claimStructHash(index, to, amount));
    }

    /// @notice Mints on `token` with a voucher from the claims key, as gldt_swap does for an ICP burn.
    function mintByClaim(GLDT token, uint64 index, address to, uint256 amount) internal {
        token.claimFromIcp(index, to, amount, signClaim(icpKey, address(token), index, to, amount));
    }

    function _claimStructHash(uint64 index, address to, uint256 amount) private pure returns (bytes32) {
        return
            keccak256(
                abi.encode(keccak256("Claim(uint64 icpBurnIndex,address recipient,uint256 amount)"), index, to, amount)
            );
    }

    // Admin actions, hashed from the type strings and never from the contract.

    /// @notice The admin action digest gldt_swap signs for `token`.
    function executeDigest(
        address token,
        IGLDT.Call[] memory calls,
        uint256 nonce,
        uint256 deadline
    ) internal view returns (bytes32) {
        return
            keccak256(abi.encodePacked("\x19\x01", domainSeparator(token), executeStructHash(calls, nonce, deadline)));
    }

    /// @notice An admin action for tokenA, signed with the admin key.
    function signExecute(
        IGLDT.Call[] memory calls,
        uint256 nonce,
        uint256 deadline
    ) internal view returns (bytes memory) {
        return signExecute(adminKey, address(tokenA), calls, nonce, deadline);
    }

    /// @notice An admin action for `token`, signed with `key`.
    function signExecute(
        uint256 key,
        address token,
        IGLDT.Call[] memory calls,
        uint256 nonce,
        uint256 deadline
    ) internal view returns (bytes memory) {
        return signTyped(key, token, executeStructHash(calls, nonce, deadline));
    }

    /// @notice Signs an admin action with the admin key, valid for 7 days, and submits it, as an ops script does
    /// after the vote.
    function executeAsAdmin(GLDT token, IGLDT.Call[] memory calls, uint256 nonce) internal {
        uint256 deadline = block.timestamp + 7 days;
        token.execute(calls, nonce, deadline, signExecute(adminKey, address(token), calls, nonce, deadline));
    }

    /// @notice A batch of one call to `token` itself.
    function selfCall(GLDT token, bytes memory data) internal pure returns (IGLDT.Call[] memory calls) {
        calls = new IGLDT.Call[](1);
        calls[0] = IGLDT.Call(address(token), data);
    }

    /// @notice The EIP-712 struct hash of Execute{calls, nonce, deadline}.
    function executeStructHash(
        IGLDT.Call[] memory calls,
        uint256 nonce,
        uint256 deadline
    ) internal pure returns (bytes32) {
        bytes memory callHashes;
        for (uint256 i = 0; i < calls.length; i++) {
            bytes32 callHash = keccak256(
                abi.encode(keccak256("Call(address target,bytes data)"), calls[i].target, keccak256(calls[i].data))
            );
            callHashes = abi.encodePacked(callHashes, callHash);
        }
        return
            keccak256(
                abi.encode(
                    keccak256("Execute(Call[] calls,uint256 nonce,uint256 deadline)Call(address target,bytes data)"),
                    keccak256(callHashes),
                    nonce,
                    deadline
                )
            );
    }

    // LayerZero delivery with every required DVN. TestHelperOz5.verifyPackets signs with requiredDVNs[0] only,
    // so it cannot commit a packet that needs two DVNs.

    /// @notice Verifies, commits and executes every queued packet for `dst` on `dstEid`, like the executor would.
    function deliverPackets(uint32 dstEid, address dst) internal {
        DoubleEndedQueue.Bytes32Deque storage queue = packetsQueue[dstEid][addressToBytes32(dst)];
        while (queue.length() > 0) {
            bytes32 guid = queue.popBack();
            this.verifyWithRequiredDvns(packets[guid]);
            this.lzReceive(packets[guid], optionsLookup[guid]);
        }
    }

    /// @notice Verifies and commits the next queued packet for `dst`, without executing it.
    function verifyNextPacket(uint32 dstEid, address dst) internal returns (bytes memory packet, bytes memory options) {
        bytes32 guid = packetsQueue[dstEid][addressToBytes32(dst)].popBack();
        packet = packets[guid];
        options = optionsLookup[guid];
        this.verifyWithRequiredDvns(packet);
    }

    /// @dev External so the packet is calldata, which PacketV1Codec needs. Each required DVN of the receive
    /// library submits its verification, then anyone commits it to the endpoint.
    function verifyWithRequiredDvns(bytes calldata packet) external {
        address receiver = packet.receiverB20();
        uint32 srcEid = packet.srcEid();
        (address lib, ) = EndpointV2Mock(endpoints[packet.dstEid()]).getReceiveLibrary(receiver, srcEid);
        UlnConfig memory config = ReceiveUln302Mock(lib).getUlnConfig(receiver, srcEid);
        bytes memory header = packet.header();
        bytes32 payloadHash = keccak256(packet.payload());
        for (uint256 i = 0; i < config.requiredDVNs.length; i++) {
            vm.prank(config.requiredDVNs[i]);
            ReceiveUln302Mock(lib).verify(header, payloadHash, config.confirmations);
        }
        ReceiveUln302Mock(lib).commitVerification(header, payloadHash);
    }

    /// @notice Splits a packet into what `endpoint.lzReceive` takes.
    function decodePacket(
        bytes calldata packet
    ) external pure returns (Origin memory origin, address receiver, bytes32 guid, bytes memory message) {
        origin = Origin(packet.srcEid(), packet.sender(), packet.nonce());
        receiver = packet.receiverB20();
        guid = packet.guid();
        message = packet.message();
    }

    /// @notice Two new DVNs on `localEid` for messages to and from `remoteEid`, sorted ascending.
    function _deployDvnPair(
        uint32 localEid,
        uint32 remoteEid,
        address sendLib,
        address receiveLib
    ) internal returns (address[] memory dvns) {
        dvns = new address[](2);
        dvns[0] = _deployDvn(localEid, remoteEid, sendLib, receiveLib, localEid * 10 + 1);
        dvns[1] = _deployDvn(localEid, remoteEid, sendLib, receiveLib, localEid * 10 + 2);
        if (dvns[0] > dvns[1]) (dvns[0], dvns[1]) = (dvns[1], dvns[0]);
    }

    function _deployDvn(
        uint32 localEid,
        uint32 remoteEid,
        address sendLib,
        address receiveLib,
        uint32 vid
    ) private returns (address) {
        address[] memory libs = new address[](2);
        libs[0] = sendLib;
        libs[1] = receiveLib;
        address[] memory admins = new address[](1);
        admins[0] = address(this);
        DVNMock dvn = new DVNMock(
            localEid,
            vid,
            libs,
            address(endpointSetup.priceFeed),
            endpointSetup.signers,
            1,
            admins
        );
        dvn.setWorkerFeeLib(address(new DVNFeeLibMock(localEid, 1e18)));
        IDVN.DstConfigParam[] memory dst = new IDVN.DstConfigParam[](1);
        dst[0] = IDVN.DstConfigParam({ dstEid: remoteEid, gas: 5000, multiplierBps: 10000, floorMarginUSD: 1e10 });
        dvn.setDstConfig(dst);
        return address(dvn);
    }
}
