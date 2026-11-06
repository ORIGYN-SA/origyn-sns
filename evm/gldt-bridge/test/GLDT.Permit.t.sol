// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.28;

import { ERC20PermitUpgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";

import { GLDTFixture } from "./helpers/GLDTFixture.sol";

contract GLDTPermitTest is GLDTFixture {
    bytes32 internal constant PERMIT_TYPEHASH =
        keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");

    uint256 internal aliceKey = 0xA11CE;
    address internal alice = vm.addr(0xA11CE);
    address internal bob = makeAddr("bob");
    address internal relayer = makeAddr("relayer");

    struct Sig {
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    function test_permit_sets_allowance_and_bumps_nonce() public {
        uint256 deadline = block.timestamp + 1 hours;
        assertEq(tokenA.nonces(alice), 0);
        Sig memory sig = _signPermit(aliceKey, address(tokenA), alice, relayer, 7e8, 0, deadline);

        vm.prank(bob); // anyone may submit it
        tokenA.permit(alice, relayer, 7e8, deadline, sig.v, sig.r, sig.s);

        assertEq(tokenA.allowance(alice, relayer), 7e8);
        assertEq(tokenA.nonces(alice), 1);
        assertEq(tokenB.nonces(alice), 0);
    }

    function test_sponsor_pays_gas_permit_then_transferFrom() public {
        deal(address(tokenA), alice, 10e8, true);
        vm.deal(relayer, 1 ether);
        assertEq(alice.balance, 0);
        uint256 deadline = block.timestamp + 1 hours;
        Sig memory sig = _signPermit(aliceKey, address(tokenA), alice, relayer, 5e8, 0, deadline);

        vm.startPrank(relayer, relayer);
        tokenA.permit(alice, relayer, 5e8, deadline, sig.v, sig.r, sig.s);
        assertTrue(tokenA.transferFrom(alice, bob, 5e8));
        vm.stopPrank();

        assertEq(tokenA.balanceOf(alice), 5e8);
        assertEq(tokenA.balanceOf(bob), 5e8);
        assertEq(tokenA.allowance(alice, relayer), 0);
        assertEq(tokenA.totalSupply(), 10e8);
        // Alice spent no gas and sent no transaction.
        assertEq(alice.balance, 0);
        assertEq(vm.getNonce(alice), 0);
    }

    function test_permit_expired_wrong_signer_or_replay_reverts() public {
        // Expired.
        uint256 past = block.timestamp - 1;
        Sig memory sig = _signPermit(aliceKey, address(tokenA), alice, relayer, 5e8, 0, past);
        vm.expectRevert(abi.encodeWithSelector(ERC20PermitUpgradeable.ERC2612ExpiredSignature.selector, past));
        tokenA.permit(alice, relayer, 5e8, past, sig.v, sig.r, sig.s);

        // Signed by someone other than the owner.
        uint256 deadline = block.timestamp + 1 hours;
        uint256 malloryKey = 0xBAD;
        sig = _signPermit(malloryKey, address(tokenA), alice, relayer, 5e8, 0, deadline);
        vm.expectRevert(
            abi.encodeWithSelector(ERC20PermitUpgradeable.ERC2612InvalidSigner.selector, vm.addr(malloryKey), alice)
        );
        tokenA.permit(alice, relayer, 5e8, deadline, sig.v, sig.r, sig.s);

        // Replayed: the nonce moved on, so the same signature recovers to some other address.
        sig = _signPermit(aliceKey, address(tokenA), alice, relayer, 5e8, 0, deadline);
        tokenA.permit(alice, relayer, 5e8, deadline, sig.v, sig.r, sig.s);
        address recovered = ecrecover(
            _permitDigest(address(tokenA), alice, relayer, 5e8, 1, deadline),
            sig.v,
            sig.r,
            sig.s
        );
        vm.expectRevert(abi.encodeWithSelector(ERC20PermitUpgradeable.ERC2612InvalidSigner.selector, recovered, alice));
        tokenA.permit(alice, relayer, 5e8, deadline, sig.v, sig.r, sig.s);
        assertEq(tokenA.nonces(alice), 1);
    }

    function test_permit_works_while_both_pause_flags_set() public {
        deal(address(tokenA), alice, 10e8, true);
        vm.prank(operator);
        tokenA.setPaused(true, true);

        uint256 deadline = block.timestamp + 1 hours;
        Sig memory sig = _signPermit(aliceKey, address(tokenA), alice, relayer, 5e8, 0, deadline);
        vm.prank(relayer);
        tokenA.permit(alice, relayer, 5e8, deadline, sig.v, sig.r, sig.s);
        assertEq(tokenA.allowance(alice, relayer), 5e8);

        // Plain ERC-20 moves are never paused either.
        vm.prank(relayer);
        assertTrue(tokenA.transferFrom(alice, bob, 3e8));
        vm.prank(alice);
        assertTrue(tokenA.transfer(bob, 1e8));
        assertEq(tokenA.balanceOf(bob), 4e8);
        assertEq(tokenA.balanceOf(alice), 6e8);
    }

    function test_domain_is_gold_token_v1() public view {
        (
            bytes1 fields,
            string memory name,
            string memory version,
            uint256 chainId,
            address verifyingContract,
            bytes32 salt,
            uint256[] memory extensions
        ) = tokenA.eip712Domain();
        assertEq(fields, hex"0f");
        assertEq(name, "Gold Token");
        assertEq(version, "1");
        assertEq(chainId, block.chainid);
        assertEq(verifyingContract, address(tokenA));
        assertEq(salt, bytes32(0));
        assertEq(extensions.length, 0);

        assertEq(tokenA.DOMAIN_SEPARATOR(), domainSeparator(address(tokenA)));
        assertEq(tokenB.DOMAIN_SEPARATOR(), domainSeparator(address(tokenB)));
        assertTrue(tokenA.DOMAIN_SEPARATOR() != tokenB.DOMAIN_SEPARATOR());
    }

    function test_permit_signed_for_tokenB_fails_on_tokenA() public {
        uint256 deadline = block.timestamp + 1 hours;
        Sig memory sig = _signPermit(aliceKey, address(tokenB), alice, relayer, 5e8, 0, deadline);
        address recovered = ecrecover(
            _permitDigest(address(tokenA), alice, relayer, 5e8, 0, deadline),
            sig.v,
            sig.r,
            sig.s
        );
        assertTrue(recovered != alice);

        vm.expectRevert(abi.encodeWithSelector(ERC20PermitUpgradeable.ERC2612InvalidSigner.selector, recovered, alice));
        tokenA.permit(alice, relayer, 5e8, deadline, sig.v, sig.r, sig.s);
        assertEq(tokenA.nonces(alice), 0);

        // The same signature is good on the token it was signed for.
        tokenB.permit(alice, relayer, 5e8, deadline, sig.v, sig.r, sig.s);
        assertEq(tokenB.allowance(alice, relayer), 5e8);
    }

    function _permitDigest(
        address token,
        address owner,
        address spender,
        uint256 value,
        uint256 nonce,
        uint256 deadline
    ) private view returns (bytes32) {
        bytes32 structHash = keccak256(abi.encode(PERMIT_TYPEHASH, owner, spender, value, nonce, deadline));
        return keccak256(abi.encodePacked("\x19\x01", domainSeparator(token), structHash));
    }

    function _signPermit(
        uint256 key,
        address token,
        address owner,
        address spender,
        uint256 value,
        uint256 nonce,
        uint256 deadline
    ) private view returns (Sig memory sig) {
        (sig.v, sig.r, sig.s) = vm.sign(key, _permitDigest(token, owner, spender, value, nonce, deadline));
    }
}
