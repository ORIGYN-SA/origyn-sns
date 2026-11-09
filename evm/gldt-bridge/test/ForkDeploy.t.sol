// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.28;

import { Test, Vm } from "forge-std/Test.sol";
import { UlnConfig } from "@layerzerolabs/lz-evm-messagelib-v2/contracts/uln/UlnBase.sol";
import { ExecutorConfig } from "@layerzerolabs/lz-evm-messagelib-v2/contracts/SendLibBase.sol";
import { ILayerZeroEndpointV2, Origin } from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/ILayerZeroEndpointV2.sol";
import { PacketV1Codec } from "@layerzerolabs/lz-evm-protocol-v2/contracts/messagelib/libs/PacketV1Codec.sol";
import { SendParam, MessagingFee } from "@layerzerolabs/oft-evm/contracts/interfaces/IOFT.sol";

import { GLDT } from "../src/GLDT.sol";
import { GLDTConfig, GLDTDeployment, IUlnConfigReader, IExecutorConfigReader } from "../script/lib/GLDTConfig.sol";
import { GLDTDeployCore } from "../script/lib/GLDTDeployCore.sol";
import { GLDTCheckCore } from "../script/lib/GLDTCheckCore.sol";

interface IReceiveUlnVerify {
    function verify(bytes calldata packetHeader, bytes32 payloadHash, uint64 confirmations) external;

    function commitVerification(bytes calldata packetHeader, bytes32 payloadHash) external;
}

/// @notice Deploys GLDT on forks of Ethereum and Base with the real config files, then runs every Check item
/// against the real EndpointV2, SendUln302, ReceiveUln302, executor and DVNs. Skipped unless ETH_RPC_URL and
/// BASE_RPC_URL are set:
///   ETH_RPC_URL=https://ethereum-rpc.publicnode.com BASE_RPC_URL=https://base-rpc.publicnode.com \
///     forge test --match-path test/ForkDeploy.t.sol -vv
/// Each chain runs in its own external call after createSelectFork, so no block value is reused across chains.
contract ForkDeployTest is Test, GLDTDeployCore, GLDTCheckCore {
    using PacketV1Codec for bytes;

    // The production signer addresses and the LayerZero endpoint.
    address internal constant ICP_SIGNER = 0x0A82D20142d067C8AF32f48664bDDfb65EcAE507;
    address internal constant ADMIN_SIGNER = 0x216C1E5F2b9EB767Cec5C7d4DFa2d02b5A0AA143;
    address internal constant ENDPOINT_V2 = 0x1a44076050125825900e736c501f859c50fE728c;

    // The operator wallet and its salt are set only at launch. Until then a test wallet stands in for both,
    // with the salt shape: wallet address, 0x00, 11 more bytes.
    address internal testWallet = makeAddr("operator wallet");
    bytes32 internal testSalt = bytes32(abi.encodePacked(testWallet, bytes1(0x00), bytes11(keccak256("fork dry run"))));

    function test_fork_same_address_and_all_checks_pass() public {
        (string memory ethRpc, string memory baseRpc) = _forkUrls();
        GLDTConfig memory eth = _forkConfig("ethereum");
        GLDTConfig memory base = _forkConfig("base");
        _assertPaired(eth, base);

        vm.createSelectFork(ethRpc);
        (address ethProxy, uint256 ethFailures) = this.deployAndCheck(eth);
        vm.createSelectFork(baseRpc);
        (address baseProxy, uint256 baseFailures) = this.deployAndCheck(base);

        assertEq(ethFailures, 0, "every check passes on Ethereum");
        assertEq(baseFailures, 0, "every check passes on Base");
        assertEq(ethProxy, baseProxy, "one proxy address on both chains");
    }

    /// @notice The libraries, executor and DVNs in the config files are LayerZero's own current defaults for this
    /// path, read on chain. Confirmations are our own choice (12 each way), so they are not compared here.
    function test_fork_config_matches_layerzero_defaults() public {
        (string memory ethRpc, string memory baseRpc) = _forkUrls();
        vm.createSelectFork(ethRpc);
        this.assertLayerZeroDefaults(_forkConfig("ethereum"));
        vm.createSelectFork(baseRpc);
        this.assertLayerZeroDefaults(_forkConfig("base"));
    }

    /// @notice A LayerZero send from Ethereum, verified by Base's two required DVNs and delivered with exactly the
    /// enforced gas, mints on Base. This is the costliest delivery: first message on the path, to a fresh holder,
    /// on a chain whose supply is 0.
    function test_fork_send_ethereum_to_base_delivers_with_enforced_gas() public {
        (string memory ethRpc, string memory baseRpc) = _forkUrls();
        GLDTConfig memory eth = _forkConfig("ethereum");
        GLDTConfig memory base = _forkConfig("base");
        address alice = makeAddr("alice");
        address bob = makeAddr("bob, a fresh holder");

        vm.createSelectFork(ethRpc);
        address token = this.deployOnly(eth);
        deal(token, alice, 5e8, true);
        vm.deal(alice, 1 ether);
        SendParam memory sp = SendParam(eth.peerEid, bytes32(uint256(uint160(bob))), 2e8, 2e8, "", "", "");
        MessagingFee memory fee = GLDT(token).quoteSend(sp, false);
        assertGt(fee.nativeFee, 0, "the real executor and DVNs charge for this path");
        vm.recordLogs();
        vm.prank(alice);
        GLDT(token).send{ value: fee.nativeFee }(sp, fee, alice);
        bytes memory packet = _packetSent(vm.getRecordedLogs(), eth.endpoint);
        assertEq(GLDT(token).totalSupply(), 3e8, "the send burned on Ethereum");

        vm.createSelectFork(baseRpc);
        assertEq(this.deployOnly(base), token, "same address on Base");
        this.deliver(packet, base);
        assertEq(GLDT(token).balanceOf(bob), 2e8, "minted on Base");
        assertEq(GLDT(token).totalSupply(), 2e8);
    }

    /// @notice Check is not vacuous on the real contracts: wrong settings give FAIL lines.
    function test_fork_check_fails_on_wrong_settings() public {
        (string memory ethRpc, ) = _forkUrls();
        GLDTConfig memory eth = _forkConfig("ethereum");
        vm.createSelectFork(ethRpc);
        address token = this.deployOnly(eth);

        vm.prank(eth.operator);
        GLDT(token).setPaused(true, false);
        GLDTConfig memory wrong = _forkConfig("ethereum");
        wrong.receiveConfirmations += 1;
        wrong.icpSigner = ADMIN_SIGNER;

        // paused, icpSigner, receive ULN stored and receive ULN effective
        assertEq(this.checkOnly(wrong, token), 4, "four items fail");
        assertEq(this.checkOnly(eth, token), 1, "only the pause fails with the right config");
    }

    // Helpers, each run in its own call frame on the selected fork.

    function deployAndCheck(GLDTConfig memory c) external returns (address proxy, uint256 failures) {
        GLDTDeployment memory d = _deployAsWallet(c);
        failures = _checkGLDT(c, d, d.proxy);
        proxy = d.proxy;
    }

    function deployOnly(GLDTConfig memory c) external returns (address) {
        return _deployAsWallet(c).proxy;
    }

    function checkOnly(GLDTConfig memory c, address proxy) external returns (uint256) {
        address impl = address(uint160(uint256(vm.load(proxy, ERC1967_IMPLEMENTATION_SLOT))));
        GLDTDeployment memory d = GLDTDeployment(c.chainId, proxy, impl, impl.codehash, 0);
        return _checkGLDT(c, d, proxy);
    }

    function assertLayerZeroDefaults(GLDTConfig memory c) external view {
        ILayerZeroEndpointV2 endpoint = ILayerZeroEndpointV2(c.endpoint);
        assertEq(endpoint.eid(), c.eid, "endpoint eid");
        assertEq(endpoint.defaultSendLibrary(c.peerEid), c.sendLib, "sendLib is LayerZero's default SendUln302");
        assertEq(endpoint.defaultReceiveLibrary(c.peerEid), c.receiveLib, "receiveLib is the default ReceiveUln302");

        ExecutorConfig memory ex = IExecutorConfigReader(c.sendLib).getExecutorConfig(address(0), c.peerEid);
        assertEq(c.executor, ex.executor, "executor is LayerZero's default executor");
        assertEq(c.maxMessageSize, ex.maxMessageSize, "maxMessageSize is LayerZero's default");

        UlnConfig memory sendDefault = IUlnConfigReader(c.sendLib).getUlnConfig(address(0), c.peerEid);
        _assertSubset(c.sendDVNs, sendDefault.requiredDVNs, "send DVNs are in LayerZero's default set");

        UlnConfig memory receiveDefault = IUlnConfigReader(c.receiveLib).getUlnConfig(address(0), c.peerEid);
        _assertSubset(c.receiveDVNs, receiveDefault.requiredDVNs, "receive DVNs are in LayerZero's default set");
    }

    /// @dev Each required DVN of the receive library verifies, anyone commits, then the executor's call to
    /// endpoint.lzReceive gets exactly the enforced gas.
    function deliver(bytes calldata packet, GLDTConfig memory dst) external {
        bytes memory header = packet.header();
        bytes32 payloadHash = keccak256(packet.payload());
        for (uint256 i = 0; i < dst.receiveDVNs.length; i++) {
            vm.prank(dst.receiveDVNs[i]);
            IReceiveUlnVerify(dst.receiveLib).verify(header, payloadHash, dst.receiveConfirmations);
        }
        IReceiveUlnVerify(dst.receiveLib).commitVerification(header, payloadHash);
        Origin memory origin = Origin(packet.srcEid(), packet.sender(), packet.nonce());
        uint256 before = gasleft();
        ILayerZeroEndpointV2(dst.endpoint).lzReceive{ gas: dst.lzReceiveGas }(
            origin,
            packet.receiverB20(),
            packet.guid(),
            packet.message(),
            ""
        );
        emit log_named_uint("gas used by the delivery, enforced gas included", before - gasleft());
    }

    function _deployAsWallet(GLDTConfig memory c) internal returns (GLDTDeployment memory d) {
        vm.deal(c.operator, 1 ether);
        vm.startPrank(c.operator);
        d = _deployGLDT(c, c.operator);
        vm.stopPrank();
    }

    function _forkUrls() internal returns (string memory eth, string memory base) {
        eth = vm.envOr("ETH_RPC_URL", string(""));
        base = vm.envOr("BASE_RPC_URL", string(""));
        if (bytes(eth).length == 0 || bytes(base).length == 0) vm.skip(true);
    }

    /// @dev The config file as is, with the test wallet and salt while the file leaves them unset.
    function _forkConfig(string memory chain) internal view returns (GLDTConfig memory c) {
        c = _loadConfig(string.concat("script/config/", chain, ".json"));
        if (c.operator == address(0) && c.salt == bytes32(0)) {
            c.operator = testWallet;
            c.salt = testSalt;
        }
    }

    function _assertPaired(GLDTConfig memory eth, GLDTConfig memory base) internal pure {
        assertEq(eth.chainId, 1, "Ethereum chain id");
        assertEq(base.chainId, 8453, "Base chain id");
        assertEq(eth.eid, 30101, "Ethereum eid");
        assertEq(base.eid, 30184, "Base eid");
        assertEq(eth.peerEid, base.eid, "Ethereum peers with Base");
        assertEq(base.peerEid, eth.eid, "Base peers with Ethereum");
        assertEq(eth.endpoint, ENDPOINT_V2, "Ethereum endpoint");
        assertEq(base.endpoint, ENDPOINT_V2, "Base endpoint");
        // ULN confirmations count blocks of the source chain, so each send side must equal the other receive side.
        assertEq(eth.sendConfirmations, base.receiveConfirmations, "Ethereum to Base confirmations agree");
        assertEq(base.sendConfirmations, eth.receiveConfirmations, "Base to Ethereum confirmations agree");
        assertEq(eth.sendDVNs.length, 2, "two required DVNs");
        assertEq(base.sendDVNs.length, 2, "two required DVNs");
        assertEq(eth.adminSigner, ADMIN_SIGNER, "Ethereum adminSigner is the production key");
        assertEq(base.adminSigner, ADMIN_SIGNER, "Base adminSigner is the production key");
        assertEq(eth.icpSigner, ICP_SIGNER, "Ethereum icpSigner is the production key");
        assertEq(base.icpSigner, ICP_SIGNER, "Base icpSigner is the production key");
        assertEq(eth.lzReceiveGas, 100_000, "Ethereum lzReceiveGas");
        assertEq(base.lzReceiveGas, 100_000, "Base lzReceiveGas");
        assertEq(eth.operator, base.operator, "one operator wallet");
        assertEq(eth.salt, base.salt, "one salt");
    }

    function _assertSubset(address[] memory items, address[] memory set, string memory what) internal pure {
        for (uint256 i = 0; i < items.length; i++) {
            bool found;
            for (uint256 j = 0; j < set.length; j++) {
                if (items[i] == set[j]) found = true;
            }
            assertTrue(found, what);
        }
    }

    function _packetSent(Vm.Log[] memory logs, address endpoint) internal pure returns (bytes memory packet) {
        bytes32 topic = keccak256("PacketSent(bytes,bytes,address)");
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].emitter == endpoint && logs[i].topics[0] == topic) {
                (packet, , ) = abi.decode(logs[i].data, (bytes, bytes, address));
                return packet;
            }
        }
        revert("no PacketSent");
    }
}
