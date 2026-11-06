// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.28;

import { Upgrades, Options } from "openzeppelin-foundry-upgrades/Upgrades.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { ERC1967Utils } from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Utils.sol";
import { IERC1967 } from "@openzeppelin/contracts/interfaces/IERC1967.sol";

import { IGLDT } from "../src/IGLDT.sol";
import { GLDTFixture } from "./helpers/GLDTFixture.sol";
import { GLDTV2Mock } from "./mocks/GLDTV2Mock.sol";

contract GLDTUpgradeTest is GLDTFixture {
    /// @dev keccak256(abi.encode(uint256(keccak256("gldt.storage.GLDT")) - 1)) & ~bytes32(uint256(0xff))
    uint256 internal constant GLDT_STORAGE_SLOT = 0x3084c67bbad50587897ca408b5a5f48944d58a2de470a5f329e23869660eeb00;
    /// @dev Slot offsets in GLDTStorage: operator and both pause flags share slot 2, mappings take 3 and 4.
    uint256 internal constant MIN_BURN_OFFSET = 6;
    uint256 internal constant UPGRADE_ALLOWED_OFFSET = 7;

    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal stranger = makeAddr("stranger");
    /// @dev A 10 byte principal: length byte, then the bytes, then zeros.
    bytes32 internal principal10 = bytes32(uint256(10) << 248) | bytes32(uint256(0xAB) << 240);

    GLDTV2Mock internal v2;

    function setUp() public override {
        super.setUp();
        v2 = new GLDTV2Mock(address(endpointA));

        // Some state worth keeping: a claim, a burn to ICP and a balance.
        mintByClaim(tokenA, 1, alice, 10e8);
        vm.prank(alice);
        tokenA.burnToIcp(1e8, principal10, bytes32(0));
        vm.prank(alice);
        assertTrue(tokenA.transfer(bob, 2e8));
    }

    function test_upgradeExact_with_right_hash_upgrades() public {
        // The offsets below are right: minBurnToIcp sits at offset 6.
        assertEq(uint256(_gldtSlot(MIN_BURN_OFFSET)), MIN_BURN_TO_ICP);
        assertEq(_gldtSlot(UPGRADE_ALLOWED_OFFSET), bytes32(0));

        IGLDT.Call[] memory calls = selfCall(
            tokenA,
            abi.encodeCall(IGLDT.upgradeExact, (address(v2), address(v2).codehash))
        );
        vm.expectEmit(address(tokenA));
        emit IERC1967.Upgraded(address(v2));
        executeAsAdmin(tokenA, calls, 1);

        assertEq(_implementation(address(tokenA)), address(v2));
        assertEq(GLDTV2Mock(address(tokenA)).version(), 2);
        // upgradeAllowed holds an address only for the length of the call.
        assertEq(_gldtSlot(UPGRADE_ALLOWED_OFFSET), bytes32(0));

        // Balances, the burn counter, claims, signers and settings are kept.
        assertEq(tokenA.balanceOf(alice), 7e8);
        assertEq(tokenA.balanceOf(bob), 2e8);
        assertEq(tokenA.totalSupply(), 9e8);
        assertEq(tokenA.nextBurnId(), 1);
        assertTrue(tokenA.isClaimed(1));
        assertEq(tokenA.adminSigner(), vm.addr(adminKey));
        assertEq(tokenA.icpSigner(), vm.addr(icpKey));
        assertEq(tokenA.operator(), operator);
        assertEq(tokenA.minBurnToIcp(), MIN_BURN_TO_ICP);
        assertEq(tokenA.owner(), address(tokenA));
        assertEq(tokenA.peers(EID_B), addressToBytes32(address(tokenB)));
        assertEq(tokenA.name(), NAME);
        assertEq(tokenA.decimals(), 8);
        assertTrue(tokenA.usedNonce(1));

        // The canister keeps control after the upgrade, and the next burn id follows on.
        executeAsAdmin(tokenA, selfCall(tokenA, abi.encodeCall(IGLDT.setMinBurnToIcp, (2e8))), 2);
        assertEq(tokenA.minBurnToIcp(), 2e8);
        vm.prank(alice);
        assertEq(tokenA.burnToIcp(2e8, principal10, bytes32(0)), 1);

        // The other chain's token is untouched.
        assertEq(_implementation(address(tokenB)), address(implB));
    }

    function test_upgradeExact_with_wrong_hash_reverts_CodeHashMismatch() public {
        bytes32[3] memory wrong = [keccak256("other code"), address(implA).codehash, bytes32(0)];
        for (uint256 i = 0; i < wrong.length; i++) {
            _expectExecuteRevert(
                selfCall(tokenA, abi.encodeCall(IGLDT.upgradeExact, (address(v2), wrong[i]))),
                1,
                abi.encodeWithSelector(
                    IGLDT.CallFailed.selector,
                    0,
                    abi.encodeWithSelector(IGLDT.CodeHashMismatch.selector)
                )
            );
        }
        assertEq(_implementation(address(tokenA)), address(implA));
        assertEq(_gldtSlot(UPGRADE_ALLOWED_OFFSET), bytes32(0));
    }

    function test_direct_upgradeToAndCall_via_execute_reverts_UpgradeNotAllowed() public {
        bytes memory notAllowed = abi.encodeWithSelector(
            IGLDT.CallFailed.selector,
            0,
            abi.encodeWithSelector(IGLDT.UpgradeNotAllowed.selector)
        );
        // A signed call straight to the inherited upgradeToAndCall fails, even though the token is the caller.
        _expectExecuteRevert(
            selfCall(tokenA, abi.encodeCall(UUPSUpgradeable.upgradeToAndCall, (address(v2), ""))),
            1,
            notAllowed
        );
        // So does the zero address, which equals upgradeAllowed while no upgradeExact runs.
        _expectExecuteRevert(
            selfCall(tokenA, abi.encodeCall(UUPSUpgradeable.upgradeToAndCall, (address(0), ""))),
            1,
            notAllowed
        );

        // Right after an upgradeExact in the same batch, the field is clear again.
        IGLDT.Call[] memory calls = new IGLDT.Call[](2);
        calls[0] = IGLDT.Call(address(tokenA), abi.encodeCall(IGLDT.upgradeExact, (address(v2), address(v2).codehash)));
        calls[1] = IGLDT.Call(address(tokenA), abi.encodeCall(UUPSUpgradeable.upgradeToAndCall, (address(implA), "")));
        _expectExecuteRevert(
            calls,
            1,
            abi.encodeWithSelector(
                IGLDT.CallFailed.selector,
                1,
                abi.encodeWithSelector(IGLDT.UpgradeNotAllowed.selector)
            )
        );

        assertEq(_implementation(address(tokenA)), address(implA));
    }

    function test_upgradeToAndCall_from_stranger_reverts() public {
        address[4] memory callers = [stranger, operator, vm.addr(adminKey), address(tokenA)];
        for (uint256 i = 0; i < callers.length; i++) {
            vm.prank(callers[i]);
            vm.expectRevert(IGLDT.UpgradeNotAllowed.selector);
            tokenA.upgradeToAndCall(address(v2), "");
        }

        // The implementation itself cannot be upgraded or called through UUPS either.
        vm.expectRevert(UUPSUpgradeable.UUPSUnauthorizedCallContext.selector);
        implA.upgradeToAndCall(address(v2), "");

        assertEq(_implementation(address(tokenA)), address(implA));
    }

    function test_old_voucher_claims_after_upgrade() public {
        // Signed before the upgrade.
        bytes memory voucher = signClaim(icpKey, address(tokenA), 2, bob, 3e8);
        IGLDT.Call[] memory later = selfCall(tokenA, abi.encodeCall(IGLDT.setMinBurnToIcp, (2e8)));
        uint256 deadline = block.timestamp + 7 days;
        bytes memory laterSig = signExecute(later, 5, deadline);
        bytes32 separator = tokenA.DOMAIN_SEPARATOR();

        executeAsAdmin(
            tokenA,
            selfCall(tokenA, abi.encodeCall(IGLDT.upgradeExact, (address(v2), address(v2).codehash))),
            1
        );
        assertEq(GLDTV2Mock(address(tokenA)).version(), 2);

        // The EIP-712 domain is the same, so the voucher and the signed admin action still work.
        assertEq(tokenA.DOMAIN_SEPARATOR(), separator);
        assertEq(tokenA.DOMAIN_SEPARATOR(), domainSeparator(address(tokenA)));
        tokenA.claimFromIcp(2, bob, 3e8, voucher);
        assertEq(tokenA.balanceOf(bob), 5e8);
        assertTrue(tokenA.isClaimed(2));
        tokenA.execute(later, 5, deadline, laterSig);
        assertEq(tokenA.minBurnToIcp(), 2e8);

        // And a claimed index stays claimed.
        vm.expectRevert(IGLDT.AlreadyClaimed.selector);
        tokenA.claimFromIcp(1, alice, 10e8, signClaim(icpKey, address(tokenA), 1, alice, 10e8));
    }

    function test_storage_layout_is_compatible() public {
        Options memory opts;
        opts.referenceContract = "GLDT.sol";
        // LayerZero's upgradeable bases keep the endpoint (and the OFT decimal rate) as immutables set by their
        // constructors, so the implementation is bound to one endpoint. Only these two findings are allowed.
        opts.unsafeAllow = "state-variable-immutable,constructor";
        Upgrades.validateUpgrade("GLDTV2Mock.sol", opts);
    }

    function _gldtSlot(uint256 offset) private view returns (bytes32) {
        return vm.load(address(tokenA), bytes32(GLDT_STORAGE_SLOT + offset));
    }

    function _implementation(address proxy) private view returns (address) {
        return address(uint160(uint256(vm.load(proxy, ERC1967Utils.IMPLEMENTATION_SLOT))));
    }

    function _expectExecuteRevert(IGLDT.Call[] memory calls, uint256 nonce, bytes memory reason) private {
        uint256 deadline = block.timestamp + 7 days;
        bytes memory sig = signExecute(calls, nonce, deadline);
        vm.expectRevert(reason);
        tokenA.execute(calls, nonce, deadline, sig);
        assertFalse(tokenA.usedNonce(nonce));
    }
}
