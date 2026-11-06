// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.28;

import { Vm } from "forge-std/Vm.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { IERC20Errors } from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";

import { IGLDT } from "../src/IGLDT.sol";
import { IcpPrincipal } from "../src/libs/IcpPrincipal.sol";
import { GLDTFixture } from "./helpers/GLDTFixture.sol";

contract GLDTIcpTest is GLDTFixture {
    uint256 internal constant SECP256K1_N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141;
    bytes32 internal constant BURNED_TO_ICP_TOPIC =
        keccak256("BurnedToIcp(uint64,address,bytes32,bytes32,uint256)");

    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal carol = makeAddr("carol");
    address internal relayer = makeAddr("relayer");

    /// @dev A 10 byte principal (the length of a canister id) and a subaccount.
    bytes32 internal principal10 = principal(10, 0xAB);
    bytes32 internal subaccount = bytes32(uint256(42));

    function test_claim_mints_once() public {
        assertEq(tokenA.CLAIM_TYPEHASH(), keccak256("Claim(uint64 icpBurnIndex,address recipient,uint256 amount)"));
        bytes memory sig = signClaim(icpKey, address(tokenA), 7, bob, 5e8);
        assertFalse(tokenA.isClaimed(7));

        vm.expectEmit(address(tokenA));
        emit IGLDT.ClaimedFromIcp(7, bob, 5e8);
        vm.prank(relayer); // anyone may submit a voucher
        tokenA.claimFromIcp(7, bob, 5e8, sig);

        assertEq(tokenA.balanceOf(bob), 5e8);
        assertEq(tokenA.totalSupply(), 5e8);
        assertTrue(tokenA.isClaimed(7));
        assertFalse(tokenA.isClaimed(8));
        assertEq(tokenA.balanceOf(relayer), 0);
        // Claims do not touch the burn counter or the other chain.
        assertEq(tokenA.nextBurnId(), 0);
        assertEq(tokenB.totalSupply(), 0);
        assertFalse(tokenB.isClaimed(7));
    }

    function test_claim_twice_reverts_AlreadyClaimed() public {
        bytes memory sig = signClaim(icpKey, address(tokenA), 7, bob, 5e8);
        tokenA.claimFromIcp(7, bob, 5e8, sig);

        vm.expectRevert(IGLDT.AlreadyClaimed.selector);
        tokenA.claimFromIcp(7, bob, 5e8, sig);

        // A second voucher for the same ICP burn index fails too, whatever it says.
        bytes memory other = signClaim(icpKey, address(tokenA), 7, carol, 9e8);
        vm.expectRevert(IGLDT.AlreadyClaimed.selector);
        tokenA.claimFromIcp(7, carol, 9e8, other);

        assertEq(tokenA.totalSupply(), 5e8);
        assertEq(tokenA.balanceOf(carol), 0);
    }

    function test_claim_wrong_signer_or_tampered_amount_reverts_BadSignature() public {
        // Signed by the admin key, not the claims key.
        bytes memory byAdmin = signClaim(adminKey, address(tokenA), 7, bob, 5e8);
        vm.expectRevert(IGLDT.BadSignature.selector);
        tokenA.claimFromIcp(7, bob, 5e8, byAdmin);

        // Signed by the claims key, then any field changed.
        bytes memory sig = signClaim(icpKey, address(tokenA), 7, bob, 5e8);
        vm.expectRevert(IGLDT.BadSignature.selector);
        tokenA.claimFromIcp(7, bob, 6e8, sig);
        vm.expectRevert(IGLDT.BadSignature.selector);
        tokenA.claimFromIcp(7, carol, 5e8, sig);
        vm.expectRevert(IGLDT.BadSignature.selector);
        tokenA.claimFromIcp(8, bob, 5e8, sig);

        // A malformed signature is rejected by OpenZeppelin before the signer check.
        vm.expectRevert(abi.encodeWithSelector(ECDSA.ECDSAInvalidSignatureLength.selector, 64));
        tokenA.claimFromIcp(7, bob, 5e8, _slice(sig, 64));

        assertFalse(tokenA.isClaimed(7));
        assertFalse(tokenA.isClaimed(8));
        assertEq(tokenA.totalSupply(), 0);

        // Control: the untouched voucher works.
        tokenA.claimFromIcp(7, bob, 5e8, sig);
        assertEq(tokenA.balanceOf(bob), 5e8);
    }

    function test_claim_signed_for_tokenB_fails_on_tokenA() public {
        bytes memory forB = signClaim(icpKey, address(tokenB), 7, bob, 5e8);

        vm.expectRevert(IGLDT.BadSignature.selector);
        tokenA.claimFromIcp(7, bob, 5e8, forB);
        assertFalse(tokenA.isClaimed(7));

        tokenB.claimFromIcp(7, bob, 5e8, forB);
        assertEq(tokenB.balanceOf(bob), 5e8);
        assertEq(tokenA.totalSupply(), 0);
    }

    function test_claim_high_s_signature_reverts() public {
        bytes32 digest = claimDigest(address(tokenA), 7, bob, 5e8);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(icpKey, digest);
        assertLe(uint256(s), SECP256K1_N / 2);

        // The same signature with s mirrored (and v flipped) still recovers to the claims key with raw ecrecover.
        bytes32 highS = bytes32(SECP256K1_N - uint256(s));
        uint8 flippedV = v == 27 ? 28 : 27;
        assertEq(ecrecover(digest, flippedV, r, highS), vm.addr(icpKey));

        // OpenZeppelin rejects it, so gldt_swap must normalize s.
        vm.expectRevert(abi.encodeWithSelector(ECDSA.ECDSAInvalidSignatureS.selector, highS));
        tokenA.claimFromIcp(7, bob, 5e8, abi.encodePacked(r, highS, flippedV));
        assertFalse(tokenA.isClaimed(7));

        tokenA.claimFromIcp(7, bob, 5e8, abi.encodePacked(r, s, v));
        assertEq(tokenA.balanceOf(bob), 5e8);
    }

    function test_claim_zero_recipient_reverts() public {
        bytes memory sig = signClaim(icpKey, address(tokenA), 7, address(0), 5e8);
        vm.expectRevert(IGLDT.ZeroAddress.selector);
        tokenA.claimFromIcp(7, address(0), 5e8, sig);
        assertFalse(tokenA.isClaimed(7));
        assertEq(tokenA.totalSupply(), 0);
    }

    function test_claim_and_burn_revert_when_icpBridgePaused() public {
        mintByClaim(tokenA, 1, alice, 5e8);
        bytes memory sig = signClaim(icpKey, address(tokenA), 2, bob, 1e8);

        vm.prank(operator);
        tokenA.setPaused(false, true);

        vm.expectRevert(IGLDT.PathPaused.selector);
        tokenA.claimFromIcp(2, bob, 1e8, sig);
        vm.prank(alice);
        vm.expectRevert(IGLDT.PathPaused.selector);
        tokenA.burnToIcp(1e8, principal10, subaccount);

        assertFalse(tokenA.isClaimed(2));
        assertEq(tokenA.nextBurnId(), 0);
        assertEq(tokenA.balanceOf(alice), 5e8);

        // lzPaused alone leaves the ICP path open.
        vm.prank(operator);
        tokenA.setPaused(true, false);
        tokenA.claimFromIcp(2, bob, 1e8, sig);
        vm.prank(alice);
        assertEq(tokenA.burnToIcp(1e8, principal10, subaccount), 0);
        assertEq(tokenA.balanceOf(bob), 1e8);
        assertEq(tokenA.balanceOf(alice), 4e8);
    }

    function test_burn_emits_event_and_increments_id() public {
        mintByClaim(tokenA, 1, alice, 3e8);

        vm.recordLogs();
        vm.prank(alice);
        uint64 first = tokenA.burnToIcp(1e8, principal10, subaccount);
        Vm.Log memory burned = _onlyBurnedToIcpLog(vm.getRecordedLogs());

        // The exact log shape the canister fetches by id: burnId and from indexed, the rest in data.
        assertEq(first, 0);
        assertEq(burned.emitter, address(tokenA));
        assertEq(burned.topics.length, 3);
        assertEq(burned.topics[0], BURNED_TO_ICP_TOPIC);
        assertEq(burned.topics[1], bytes32(uint256(0)));
        assertEq(burned.topics[2], bytes32(uint256(uint160(alice))));
        assertEq(burned.data, abi.encode(principal10, subaccount, uint256(1e8)));

        vm.expectEmit(address(tokenA));
        emit IGLDT.BurnedToIcp(1, alice, principal10, subaccount, 1e8);
        vm.prank(alice);
        uint64 second = tokenA.burnToIcp(1e8, principal10, subaccount);
        assertEq(second, 1);

        assertEq(tokenA.nextBurnId(), 2);
        assertEq(tokenA.totalSupply(), 1e8);
        assertEq(tokenA.balanceOf(alice), 1e8);
        (uint64 next, uint256 supply, , , ) = tokenA.bridgeInfo();
        assertEq(next, 2);
        assertEq(supply, 1e8);
        // Each chain counts its own burns.
        assertEq(tokenB.nextBurnId(), 0);
    }

    function test_burn_below_min_reverts_BelowMinimum() public {
        mintByClaim(tokenA, 1, alice, 3e8);

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(IGLDT.BelowMinimum.selector, 100_000_000));
        tokenA.burnToIcp(99_999_999, principal10, subaccount);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(IGLDT.BelowMinimum.selector, 100_000_000));
        tokenA.burnToIcp(0, principal10, subaccount);
        assertEq(tokenA.nextBurnId(), 0);

        vm.prank(alice);
        assertEq(tokenA.burnToIcp(100_000_000, principal10, subaccount), 0);
        assertEq(tokenA.nextBurnId(), 1);
        assertEq(tokenA.balanceOf(alice), 2e8);
    }

    function test_burn_without_balance_reverts() public {
        mintByClaim(tokenA, 1, alice, 3e8);

        vm.prank(carol);
        vm.expectRevert(abi.encodeWithSelector(IERC20Errors.ERC20InsufficientBalance.selector, carol, 0, 1e8));
        tokenA.burnToIcp(1e8, principal10, subaccount);

        // Only the caller's own balance can burn: more than alice holds fails too.
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(IERC20Errors.ERC20InsufficientBalance.selector, alice, 3e8, 4e8));
        tokenA.burnToIcp(4e8, principal10, subaccount);

        assertEq(tokenA.balanceOf(alice), 3e8);
        assertEq(tokenA.totalSupply(), 3e8);
        assertEq(tokenA.nextBurnId(), 0);
    }

    function test_principal_encoding() public {
        // Valid: length byte 1 to 29, that many principal bytes, then zeros. Principal bytes may be zero.
        assertTrue(IcpPrincipal.isValid(principal(1, 0x04)));
        assertTrue(IcpPrincipal.isValid(principal(1, 0x00)));
        assertTrue(IcpPrincipal.isValid(principal10));
        assertTrue(IcpPrincipal.isValid(principal(29, 0xFF)));

        bytes32[] memory invalid = new bytes32[](9);
        invalid[0] = bytes32(0); // length 0
        invalid[1] = _withByte(bytes32(0), 5, 0x01); // length 0 with bytes after it
        invalid[2] = principal(30, 0x11); // length 30 still fits in 32 bytes, but is too long
        invalid[3] = principal(31, 0x11);
        invalid[4] = _withByte(bytes32(0), 0, 0xFF); // length 255
        invalid[5] = _withByte(principal10, 11, 0x01); // nonzero byte right after the principal
        invalid[6] = _withByte(principal10, 31, 0x01); // nonzero last byte
        invalid[7] = _withByte(principal(29, 0xFF), 30, 0x01);
        invalid[8] = _withByte(principal(29, 0xFF), 31, 0x01);

        mintByClaim(tokenA, 1, alice, 10e8);
        for (uint256 i = 0; i < invalid.length; i++) {
            assertFalse(IcpPrincipal.isValid(invalid[i]));
            vm.prank(alice);
            vm.expectRevert(IGLDT.BadIcpPrincipal.selector);
            tokenA.burnToIcp(1e8, invalid[i], subaccount);
        }
        assertEq(tokenA.nextBurnId(), 0);
        assertEq(tokenA.balanceOf(alice), 10e8);

        // Valid principals burn, at both length bounds, with any subaccount.
        vm.startPrank(alice);
        assertEq(tokenA.burnToIcp(1e8, principal(1, 0x04), bytes32(0)), 0);
        assertEq(tokenA.burnToIcp(1e8, principal(29, 0xFF), bytes32(type(uint256).max)), 1);
        vm.stopPrank();
    }

    /// @dev Byte 0 is `len`, bytes 1 to `len` are `fill`, the rest are zero.
    function principal(uint8 len, uint8 fill) internal pure returns (bytes32 p) {
        bytes memory b = new bytes(32);
        b[0] = bytes1(len);
        for (uint256 i = 1; i <= len && i < 32; i++) b[i] = bytes1(fill);
        // forge-lint: disable-next-line(unsafe-typecast)
        p = bytes32(b);
    }

    function _withByte(bytes32 p, uint256 index, uint8 value) private pure returns (bytes32) {
        bytes memory b = abi.encodePacked(p);
        b[index] = bytes1(value);
        // forge-lint: disable-next-line(unsafe-typecast)
        return bytes32(b);
    }

    function _slice(bytes memory b, uint256 len) private pure returns (bytes memory out) {
        out = new bytes(len);
        for (uint256 i = 0; i < len; i++) out[i] = b[i];
    }

    function _onlyBurnedToIcpLog(Vm.Log[] memory logs) private pure returns (Vm.Log memory found) {
        uint256 count;
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics[0] == BURNED_TO_ICP_TOPIC) {
                found = logs[i];
                count++;
            }
        }
        assertEq(count, 1);
    }
}
