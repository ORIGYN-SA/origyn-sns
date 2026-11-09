// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.28;

import { Script } from "forge-std/Script.sol";
import { Origin } from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/ILayerZeroEndpointV2.sol";
import { SendParam, MessagingFee } from "@layerzerolabs/oft-evm/contracts/interfaces/IOFT.sol";

import { GLDT } from "../src/GLDT.sol";
import { IGLDT } from "../src/IGLDT.sol";
import { GLDTFixture } from "./helpers/GLDTFixture.sol";
import { GLDTV2Mock } from "./mocks/GLDTV2Mock.sol";
import { GLDTConfig, GLDTDeployment } from "../script/lib/GLDTConfig.sol";
import { GLDTCheckCore } from "../script/lib/GLDTCheckCore.sol";
import { GLDTDeployCore } from "../script/lib/GLDTDeployCore.sol";
import { DeployLocalCore, LocalChain } from "../script/lib/DeployLocalCore.sol";
import { SubmitAdminAction } from "../script/SubmitAdminAction.s.sol";
import { ReplayLzMessage } from "../script/ReplayLzMessage.s.sol";

/// @dev Runs the script cores from its own address (the fixture declares constants with the same names, so the test
/// cannot inherit them). It is a Script, like the scripts it stands in for, so `forge build --sizes` skips it.
contract ScriptHarness is Script, GLDTCheckCore, GLDTDeployCore, DeployLocalCore {
    function loadConfig(string memory path) external view returns (GLDTConfig memory) {
        return _loadConfig(path);
    }

    function validateForDeploy(GLDTConfig memory c, address deployer) external view {
        _validateForDeploy(c, deployer);
    }

    function check(GLDTConfig memory c, GLDTDeployment memory d, address peer) external returns (uint256) {
        return _checkGLDT(c, d, peer);
    }

    function deployLocal(
        address operator,
        address adminSigner,
        address icpSigner
    ) external returns (LocalChain memory a, LocalChain memory b) {
        return _deployLocal(address(this), operator, adminSigner, icpSigner);
    }

    function localConfig(
        LocalChain memory chain,
        uint32 peerEid,
        address operator,
        address adminSigner,
        address icpSigner
    ) external view returns (GLDTConfig memory) {
        return _localConfig(chain, peerEid, operator, adminSigner, icpSigner);
    }
}

/// @notice Check, DeployLocal, SubmitAdminAction and ReplayLzMessage against the LayerZero test endpoints.
contract ScriptsTest is GLDTFixture {
    ScriptHarness internal harness;
    SubmitAdminAction internal submitScript;
    ReplayLzMessage internal replayScript;

    function setUp() public override {
        super.setUp();
        // deployCodeTo, because the harness carries GLDT's creation code and is over the EIP-170 size limit.
        harness = ScriptHarness(makeAddr("harness"));
        deployCodeTo("Scripts.t.sol:ScriptHarness", address(harness));
        submitScript = new SubmitAdminAction();
        replayScript = new ReplayLzMessage();
    }

    // Check

    function test_check_passes_on_fixture_tokens() public {
        assertEq(harness.check(_fixtureConfig(true), _deployment(tokenA, implA), address(tokenB)), 0, "tokenA");
        assertEq(harness.check(_fixtureConfig(false), _deployment(tokenB, implB), address(tokenA)), 0, "tokenB");
    }

    function test_check_reports_state_and_config_failures() public {
        vm.prank(operator);
        tokenA.setPaused(false, true);
        GLDTConfig memory c = _fixtureConfig(true);
        c.adminSigner = vm.addr(icpKey);
        // nothing is paused, adminSigner, and the peer (tokenA is not its own peer here)
        assertEq(harness.check(c, _deployment(tokenA, implA), address(tokenA)), 3);
    }

    function test_check_reports_code_that_is_not_our_build() public {
        GLDTDeployment memory d = _deployment(tokenA, implA);
        // Another build at the implementation's address: the code hash differs from the deployment file and from a
        // fresh build of src/GLDT.sol.
        vm.etch(address(implA), address(new GLDTV2Mock(address(endpointA))).code);
        assertEq(harness.check(_fixtureConfig(true), d, address(tokenB)), 2);
    }

    // Deploy

    function test_deploy_refuses_placeholder_and_wrong_configs() public {
        address wallet = makeAddr("operator wallet");
        bytes32 salt = bytes32(abi.encodePacked(wallet, bytes1(0x00), bytes11(0)));
        GLDTConfig memory c = harness.loadConfig("script/config/ethereum.json");
        vm.expectRevert(bytes("config: operator is not set"));
        harness.validateForDeploy(c, wallet);

        c.operator = wallet;
        vm.expectRevert(bytes("deployer: the operator wallet deploys"));
        harness.validateForDeploy(c, makeAddr("someone else"));
        vm.expectRevert(bytes("config: salt is not set"));
        harness.validateForDeploy(c, wallet);
        c.salt = bytes32(abi.encodePacked(makeAddr("someone else"), bytes1(0x00), bytes11(0)));
        vm.expectRevert(bytes("config: the salt must start with the deployer address"));
        harness.validateForDeploy(c, wallet);
        // 0x01 would mix the chain id into the address, so the chains would get different addresses.
        c.salt = bytes32(abi.encodePacked(wallet, bytes1(0x01), bytes11(0)));
        vm.expectRevert(bytes("config: byte 21 of the salt must be 0x00 (no cross-chain redeploy protection)"));
        harness.validateForDeploy(c, wallet);
        c.salt = salt;

        (c.sendDVNs[0], c.sendDVNs[1]) = (c.sendDVNs[1], c.sendDVNs[0]);
        vm.expectRevert(bytes("config: DVNs must be set and sorted ascending"));
        harness.validateForDeploy(c, wallet);
        (c.sendDVNs[0], c.sendDVNs[1]) = (c.sendDVNs[1], c.sendDVNs[0]);
        c.name = "GLDT Token";
        vm.expectRevert(bytes("config: name must be Gold Token"));
        harness.validateForDeploy(c, wallet);

        // The testnet files leave confirmations at 0 until they are read on chain.
        for (uint256 i = 0; i < 2; i++) {
            GLDTConfig memory t = harness.loadConfig(
                i == 0 ? "script/config/sepolia.json" : "script/config/base-sepolia.json"
            );
            t.operator = wallet;
            t.salt = salt;
            vm.expectRevert(bytes("config: confirmations are not set"));
            harness.validateForDeploy(t, wallet);
        }
    }

    // DeployLocal

    function test_deploy_local_wires_both_tokens_and_check_passes() public {
        address admin = vm.addr(adminKey);
        address icp = vm.addr(icpKey);
        (LocalChain memory a, LocalChain memory b) = harness.deployLocal(operator, admin, icp);
        GLDTConfig memory ca = harness.localConfig(a, b.eid, operator, admin, icp);
        GLDTConfig memory cb = harness.localConfig(b, a.eid, operator, admin, icp);
        assertEq(harness.check(ca, _deployment(GLDT(a.token), GLDT(a.implementation)), b.token), 0, "token A");
        assertEq(harness.check(cb, _deployment(GLDT(b.token), GLDT(b.implementation)), a.token), 0, "token B");

        // A local send works end to end up to the endpoint (the packet sink takes it).
        mintByClaim(GLDT(a.token), 0, address(this), 3e8);
        SendParam memory sp = SendParam(b.eid, addressToBytes32(address(this)), 1e8, 1e8, "", "", "");
        MessagingFee memory fee = GLDT(a.token).quoteSend(sp, false);
        GLDT(a.token).send{ value: fee.nativeFee }(sp, fee, address(this));
        assertEq(GLDT(a.token).totalSupply(), 2e8);
    }

    // SubmitAdminAction

    function test_submit_admin_action_from_dfx_json() public {
        IGLDT.Call[] memory calls = selfCall(tokenA, abi.encodeCall(GLDT.setMinBurnToIcp, (2e8)));
        uint256 deadline = block.timestamp + 7 days;
        bytes memory sig = signExecute(adminKey, address(tokenA), calls, 41, deadline);
        // As dfx prints get_bridge_admin_action: opt as an array, nat64 as strings, blob as byte numbers.
        string memory json = string.concat(
            '[{"id":"41","chain":{"Base":null},"chain_id":"',
            vm.toString(block.chainid),
            '","token":"',
            vm.toString(address(tokenA)),
            '","calls":[{"target":"',
            vm.toString(address(tokenA)),
            '","data":',
            _byteNumbers(calls[0].data),
            '}],"nonce":"41","deadline":"',
            vm.toString(deadline),
            '","signature":"',
            vm.toString(sig),
            '","description":"Set min burn to 2 GLDT","created_at":"1730000000000000000"}]'
        );
        SubmitAdminAction.Action memory a = submitScript.parseAction(json);
        assertEq(a.id, 41);
        assertEq(a.calls.length, 1);
        assertEq(a.calls[0].data, calls[0].data);
        assertEq(a.description, "Set min burn to 2 GLDT");

        submitScript.run(json);
        assertEq(tokenA.minBurnToIcp(), 2e8);
        assertTrue(tokenA.usedNonce(41));
    }

    function test_submit_admin_action_from_hex_json_with_two_calls() public {
        IGLDT.Call[] memory calls = new IGLDT.Call[](2);
        calls[0] = IGLDT.Call(address(tokenA), abi.encodeCall(GLDT.setMinBurnToIcp, (3e8)));
        calls[1] = IGLDT.Call(address(tokenA), abi.encodeCall(GLDT.setPaused, (true, false)));
        uint256 deadline = block.timestamp + 1 days;
        bytes memory sig = signExecute(adminKey, address(tokenA), calls, 9, deadline);
        string memory json = string.concat(
            '{"id":9,"chain_id":',
            vm.toString(block.chainid),
            ',"token":"',
            vm.toString(address(tokenA)),
            '","calls":[{"target":"',
            vm.toString(calls[0].target),
            '","data":"',
            vm.toString(calls[0].data),
            '"},{"target":"',
            vm.toString(calls[1].target),
            '","data":"',
            vm.toString(calls[1].data),
            '"}],"nonce":9,"deadline":',
            vm.toString(deadline),
            ',"signature":"',
            vm.toString(sig),
            '"}'
        );
        submitScript.run(json);
        assertEq(tokenA.minBurnToIcp(), 3e8);
        (bool lzPaused, ) = tokenA.paused();
        assertTrue(lzPaused);
    }

    function test_submit_preflight_refuses_bad_actions() public {
        IGLDT.Call[] memory calls = selfCall(tokenA, abi.encodeCall(GLDT.setMinBurnToIcp, (2e8)));
        uint256 deadline = block.timestamp + 1 days;
        SubmitAdminAction.Action memory a = SubmitAdminAction.Action({
            id: 1,
            chainId: block.chainid,
            token: address(tokenA),
            calls: calls,
            nonce: 1,
            deadline: deadline,
            signature: signExecute(adminKey, address(tokenA), calls, 1, deadline),
            description: ""
        });
        submitScript.preflight(a);

        a.chainId = 8453;
        vm.expectRevert(bytes("the RPC is not the action's chain"));
        submitScript.preflight(a);
        a.chainId = block.chainid;

        a.signature = signExecute(icpKey, address(tokenA), calls, 1, deadline);
        vm.expectRevert(bytes("not signed by the token's adminSigner"));
        submitScript.preflight(a);
        // Signed for tokenB's domain, submitted to tokenA.
        a.signature = signExecute(adminKey, address(tokenB), calls, 1, deadline);
        vm.expectRevert(bytes("not signed by the token's adminSigner"));
        submitScript.preflight(a);
        a.signature = signExecute(adminKey, address(tokenA), calls, 1, deadline);

        vm.warp(deadline + 1);
        vm.expectRevert(bytes("the action's deadline has passed"));
        submitScript.preflight(a);
        vm.warp(deadline);

        executeAsAdmin(tokenA, selfCall(tokenA, abi.encodeCall(GLDT.cancelNonce, (1))), 2);
        vm.expectRevert(bytes("the action's nonce is already used or cancelled"));
        submitScript.preflight(a);

        vm.expectRevert(bytes("no action in the JSON (opt is empty)"));
        submitScript.parseAction("[]");
    }

    // ReplayLzMessage

    function test_replay_held_message_from_the_packet() public {
        address bob = makeAddr("bob");
        (bytes memory packet, ) = _sendAndVerify(bob, 2e8);
        (Origin memory origin, address receiver, bytes32 guid, bytes memory message) = this.decodePacket(packet);
        assertEq(receiver, address(tokenB));

        vm.prank(operator);
        tokenB.setPaused(true, false);
        vm.expectRevert(bytes("the token is still lzPaused: unpause it first"));
        replayScript.preflight(receiver, origin, guid, message);
        vm.prank(operator);
        tokenB.setPaused(false, false);

        replayScript.run(packet);
        assertEq(tokenB.balanceOf(bob), 2e8);
        vm.expectRevert(
            bytes("the endpoint holds nothing at this nonce: delivered already, or not verified yet")
        );
        replayScript.preflight(receiver, origin, guid, message);
    }

    function test_replay_with_parts_checks_the_held_message() public {
        address bob = makeAddr("bob");
        (bytes memory packet, ) = _sendAndVerify(bob, 2e8);
        (Origin memory origin, address receiver, bytes32 guid, bytes memory message) = this.decodePacket(packet);

        bytes memory forged = abi.encodePacked(addressToBytes32(makeAddr("mallory")), uint64(2e8));
        vm.expectRevert(bytes("the guid or message differ from the held message"));
        replayScript.run(receiver, origin.srcEid, origin.sender, origin.nonce, guid, forged);

        replayScript.run(receiver, origin.srcEid, origin.sender, origin.nonce, guid, message);
        assertEq(tokenB.balanceOf(bob), 2e8);
    }

    // Helpers

    function _fixtureConfig(bool onA) internal view returns (GLDTConfig memory c) {
        c.chain = onA ? "fixture A" : "fixture B";
        c.chainId = block.chainid;
        c.eid = onA ? EID_A : EID_B;
        c.endpoint = address(onA ? endpointA : endpointB);
        c.peerEid = onA ? EID_B : EID_A;
        c.sendLib = onA ? sendLibA : sendLibB;
        c.receiveLib = onA ? receiveLibA : receiveLibB;
        c.executor = onA ? executorA : executorB;
        c.maxMessageSize = MAX_MESSAGE_SIZE;
        c.sendConfirmations = CONFIRMATIONS;
        c.sendDVNs = onA ? dvnsA : dvnsB;
        c.receiveConfirmations = CONFIRMATIONS;
        c.receiveDVNs = onA ? dvnsA : dvnsB;
        c.lzReceiveGas = LZ_RECEIVE_GAS;
        c.operator = operator;
        c.adminSigner = vm.addr(adminKey);
        c.icpSigner = vm.addr(icpKey);
        c.name = NAME;
        c.symbol = SYMBOL;
    }

    function _deployment(GLDT token, GLDT impl) internal view returns (GLDTDeployment memory) {
        return GLDTDeployment(block.chainid, address(token), address(impl), address(impl).codehash, block.number);
    }

    /// @dev A send from tokenA to `to` on tokenB, verified and committed on B but not delivered.
    function _sendAndVerify(address to, uint256 amount) internal returns (bytes memory packet, bytes memory options) {
        mintByClaim(tokenA, 0, address(this), amount);
        SendParam memory sp = SendParam(EID_B, addressToBytes32(to), amount, amount, "", "", "");
        MessagingFee memory fee = tokenA.quoteSend(sp, false);
        tokenA.send{ value: fee.nativeFee }(sp, fee, address(this));
        return verifyNextPacket(EID_B, address(tokenB));
    }

    /// @dev A blob the way dfx prints it: [1,2,255].
    function _byteNumbers(bytes memory b) internal pure returns (string memory s) {
        s = "[";
        for (uint256 i = 0; i < b.length; i++) {
            s = string.concat(s, i == 0 ? "" : ",", vm.toString(uint256(uint8(b[i]))));
        }
        s = string.concat(s, "]");
    }
}
