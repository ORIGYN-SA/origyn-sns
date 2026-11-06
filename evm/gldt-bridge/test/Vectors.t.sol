// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.28;

import { IMessageLibManager, SetConfigParam } from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/IMessageLibManager.sol";
import { UlnConfig } from "@layerzerolabs/lz-evm-messagelib-v2/contracts/uln/UlnBase.sol";
import { ReceiveUln302Mock } from "@layerzerolabs/test-devtools-evm-foundry/contracts/mocks/ReceiveUln302Mock.sol";

import { GLDT } from "../src/GLDT.sol";
import { IGLDT } from "../src/IGLDT.sol";
import { GLDTFixture } from "./helpers/GLDTFixture.sol";

/// @notice Checks the EIP-712 vectors that gldt_swap writes to test/vectors/eip712.json against the
/// contract. The canister's digests, calldata and normalized signatures must work here byte for byte.
/// The file comes from `cargo test -p gldt_swap write_vectors -- --ignored`
/// (backend/canisters/gldt_swap/impl/src/bridge/evm/vectors.rs).
/// The vectors use Foundry's default chain id 31337, so this test never calls vm.chainId.
contract VectorsTest is GLDTFixture {
    address internal constant VECTOR_TOKEN = 0x00000000000000000000000000000000000B1d6E;

    // The values the Rust generator encodes, so solc's own encoding can be compared with the file.
    address internal constant DVN_1 = 0x000000000000000000000000000000000000d001;
    address internal constant DVN_2 = 0x000000000000000000000000000000000000D002;
    uint64 internal constant VECTOR_CONFIRMATIONS = 20;
    uint128 internal constant VECTOR_LZ_RECEIVE_GAS = 200_000;

    /// @dev The largest low s: half the secp256k1 group order.
    uint256 internal constant HALF_N = 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0;

    string internal json;
    address internal vectorSigner;
    GLDT internal token;

    function setUp() public override {
        super.setUp();
        json = vm.readFile(string.concat(vm.projectRoot(), "/test/vectors/eip712.json"));
        vectorSigner = vm.addr(vm.parseJsonUint(json, ".key"));

        // The vector key is both canister keys, on a proxy at the fixed address the vectors name.
        IGLDT.InitParams memory p = initParams(EID_A, address(tokenB));
        p.adminSigner = vectorSigner;
        p.icpSigner = vectorSigner;
        token = deployTokenAt(VECTOR_TOKEN, address(implA), p);
    }

    function test_rust_vectors_match_contract() public {
        // The environment the file was written for.
        assertEq(block.chainid, 31337);
        assertEq(vm.parseJsonUint(json, ".chainId"), block.chainid);
        assertEq(vm.parseJsonAddress(json, ".token"), VECTOR_TOKEN);
        assertEq(vm.parseJsonAddress(json, ".signer"), vectorSigner);
        assertEq(
            vm.parseJsonAddress(json, ".endpoint"),
            address(endpointA),
            "the fixture endpoint moved: update ENDPOINT in vectors.rs and run write_vectors"
        );
        assertEq(
            vm.parseJsonAddress(json, ".receiveLib"),
            receiveLibA,
            "the fixture receive library moved: update RECEIVE_LIB in vectors.rs and run write_vectors"
        );
        assertEq(token.DOMAIN_SEPARATOR(), domainSeparator(VECTOR_TOKEN));
        assertEq(token.CLAIM_TYPEHASH(), keccak256("Claim(uint64 icpBurnIndex,address recipient,uint256 amount)"));
        assertEq(
            token.EXECUTE_TYPEHASH(),
            keccak256("Execute(Call[] calls,uint256 nonce,uint256 deadline)Call(address target,bytes data)")
        );

        // Claims: the digest built from the type strings, then claimFromIcp with the vector signature.
        uint256 claims;
        while (vm.keyExistsJson(json, _at(".claims", claims))) {
            _checkClaim(_at(".claims", claims));
            claims++;
        }
        assertEq(claims, 3);
        assertEq(vm.parseJsonUint(json, ".claims[1].amount"), 2 ** 128);
        assertEq(vm.parseJsonUint(json, ".claims[2].icpBurnIndex"), type(uint64).max);

        // Executes: hashExecute equals the digest, then execute with the vector signature runs.
        uint256 executes;
        while (vm.keyExistsJson(json, _at(".executes", executes))) {
            _checkExecute(_at(".executes", executes));
            executes++;
        }
        assertEq(executes, 2);
        assertEq(vm.parseJsonUint(json, ".executes[1].nonce"), type(uint64).max);

        // What the executes did, read back: the last setMinBurnToIcp, the gas option and the ULN config.
        assertEq(token.minBurnToIcp(), 300_000_000);
        assertEq(
            token.enforcedOptions(EID_B, 1),
            abi.encodePacked(uint16(3), uint8(1), uint16(17), uint8(1), VECTOR_LZ_RECEIVE_GAS)
        );
        UlnConfig memory uln = ReceiveUln302Mock(receiveLibA).getAppUlnConfig(address(token), EID_B);
        assertEq(uln.confirmations, VECTOR_CONFIRMATIONS);
        assertEq(uln.requiredDVNCount, 2);
        assertEq(uln.optionalDVNCount, NIL_DVN_COUNT);
        assertEq(uln.optionalDVNThreshold, 0);
        assertEq(uln.requiredDVNs, _dvns());
        assertEq(uln.optionalDVNs.length, 0);
    }

    function test_rust_calldata_matches_solidity_encoding() public view {
        IGLDT.Call[] memory one = _calls(".executes[0]");
        assertEq(one.length, 1);
        assertEq(one[0].target, VECTOR_TOKEN);
        assertEq(one[0].data, abi.encodeCall(IGLDT.setMinBurnToIcp, (200_000_000)));

        IGLDT.Call[] memory three = _calls(".executes[1]");
        assertEq(three.length, 3);
        assertEq(three[0].target, VECTOR_TOKEN);
        assertEq(three[0].data, abi.encodeCall(IGLDT.setLzReceiveGas, (EID_B, VECTOR_LZ_RECEIVE_GAS)));

        SetConfigParam[] memory params = new SetConfigParam[](1);
        params[0] = SetConfigParam(
            EID_B,
            CONFIG_TYPE_ULN,
            abi.encode(
                UlnConfig({
                    confirmations: VECTOR_CONFIRMATIONS,
                    requiredDVNCount: 2,
                    optionalDVNCount: NIL_DVN_COUNT,
                    optionalDVNThreshold: 0,
                    requiredDVNs: _dvns(),
                    optionalDVNs: new address[](0)
                })
            )
        );
        assertEq(three[1].target, address(endpointA));
        assertEq(three[1].data, abi.encodeCall(IMessageLibManager.setConfig, (VECTOR_TOKEN, receiveLibA, params)));

        assertEq(three[2].target, VECTOR_TOKEN);
        assertEq(three[2].data, abi.encodeCall(IGLDT.setMinBurnToIcp, (300_000_000)));
    }

    function _checkClaim(string memory c) internal {
        uint256 rawIndex = vm.parseJsonUint(json, string.concat(c, ".icpBurnIndex"));
        assertLe(rawIndex, type(uint64).max);
        uint64 index = uint64(rawIndex);
        address to = vm.parseJsonAddress(json, string.concat(c, ".recipient"));
        uint256 amount = vm.parseJsonUint(json, string.concat(c, ".amount"));
        bytes32 digest = vm.parseJsonBytes32(json, string.concat(c, ".digest"));
        bytes memory signature = vm.parseJsonBytes(json, string.concat(c, ".signature"));

        assertEq(claimDigest(VECTOR_TOKEN, index, to, amount), digest, c);
        assertEq(_recover(digest, signature), vectorSigner, c);

        uint256 balance = token.balanceOf(to);
        vm.expectEmit(address(token));
        emit IGLDT.ClaimedFromIcp(index, to, amount);
        token.claimFromIcp(index, to, amount, signature);
        assertTrue(token.isClaimed(index), c);
        assertEq(token.balanceOf(to), balance + amount, c);
    }

    function _checkExecute(string memory e) internal {
        uint256 nonce = vm.parseJsonUint(json, string.concat(e, ".nonce"));
        uint256 deadline = vm.parseJsonUint(json, string.concat(e, ".deadline"));
        bytes32 digest = vm.parseJsonBytes32(json, string.concat(e, ".digest"));
        bytes memory signature = vm.parseJsonBytes(json, string.concat(e, ".signature"));
        IGLDT.Call[] memory calls = _calls(e);

        assertEq(token.hashExecute(calls, nonce, deadline), digest, e);
        assertEq(executeDigest(VECTOR_TOKEN, calls, nonce, deadline), digest, e);
        assertEq(_recover(digest, signature), vectorSigner, e);
        assertGe(deadline, block.timestamp, e);

        assertFalse(token.usedNonce(nonce), e);
        vm.expectEmit(address(token));
        emit IGLDT.Executed(nonce, digest);
        token.execute(calls, nonce, deadline, signature);
        assertTrue(token.usedNonce(nonce), e);
    }

    /// @dev The calls of one execute vector, in file order.
    function _calls(string memory e) internal view returns (IGLDT.Call[] memory calls) {
        string memory array = string.concat(e, ".calls");
        uint256 n;
        while (vm.keyExistsJson(json, _at(array, n))) n++;
        calls = new IGLDT.Call[](n);
        for (uint256 i = 0; i < n; i++) {
            string memory c = _at(array, i);
            calls[i] = IGLDT.Call(
                vm.parseJsonAddress(json, string.concat(c, ".target")),
                vm.parseJsonBytes(json, string.concat(c, ".data"))
            );
        }
    }

    /// @dev Plain ecrecover on r, s, v, after checking the signature has the shape OpenZeppelin accepts.
    function _recover(bytes32 digest, bytes memory signature) internal pure returns (address) {
        assertEq(signature.length, 65);
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(signature, 0x20))
            s := mload(add(signature, 0x40))
            v := byte(0, mload(add(signature, 0x60)))
        }
        assertLe(uint256(s), HALF_N, "s is high");
        assertTrue(v == 27 || v == 28, "v is not 27 or 28");
        return ecrecover(digest, v, r, s);
    }

    function _dvns() internal pure returns (address[] memory dvns) {
        dvns = new address[](2);
        dvns[0] = DVN_1;
        dvns[1] = DVN_2;
    }

    function _at(string memory array, uint256 i) internal pure returns (string memory) {
        return string.concat(array, "[", vm.toString(i), "]");
    }
}
