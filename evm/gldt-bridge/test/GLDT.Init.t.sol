// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.28;

import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { ERC1967Utils } from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Utils.sol";
import { IOAppCore } from "@layerzerolabs/oapp-evm/contracts/oapp/interfaces/IOAppCore.sol";
import { IOAppOptionsType3, EnforcedOptionParam } from "@layerzerolabs/oapp-evm/contracts/oapp/interfaces/IOAppOptionsType3.sol";
import { OptionsBuilder } from "@layerzerolabs/oapp-evm/contracts/oapp/libs/OptionsBuilder.sol";
import { SendUln302Mock } from "@layerzerolabs/test-devtools-evm-foundry/contracts/mocks/SendUln302Mock.sol";
import { ReceiveUln302Mock } from "@layerzerolabs/test-devtools-evm-foundry/contracts/mocks/ReceiveUln302Mock.sol";
import { EndpointV2Mock } from "@layerzerolabs/test-devtools-evm-foundry/contracts/mocks/EndpointV2Mock.sol";
import { UlnConfig } from "@layerzerolabs/lz-evm-messagelib-v2/contracts/uln/UlnBase.sol";
import { ExecutorConfig } from "@layerzerolabs/lz-evm-messagelib-v2/contracts/SendLibBase.sol";
import { SetConfigParam } from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/IMessageLibManager.sol";

import { GLDT } from "../src/GLDT.sol";
import { IGLDT } from "../src/IGLDT.sol";
import { GLDTFixture } from "./helpers/GLDTFixture.sol";

contract GLDTInitTest is GLDTFixture {
    using OptionsBuilder for bytes;

    /// @dev keccak256(abi.encode(uint256(keccak256("gldt.storage.GLDT")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 internal constant GLDT_STORAGE_SLOT = 0x3084c67bbad50587897ca408b5a5f48944d58a2de470a5f329e23869660eeb00;

    address internal stranger = makeAddr("stranger");

    struct Deployed {
        GLDT token;
        EndpointV2Mock ep;
        address impl;
        uint32 peerEid;
        address peerToken;
        address sendLib;
        address receiveLib;
        address executor;
        address[] dvns;
    }

    function test_initialize_sets_everything() public view {
        Deployed memory a = Deployed(tokenA, endpointA, address(implA), EID_B, address(tokenB), sendLibA, receiveLibA, executorA, dvnsA);
        Deployed memory b = Deployed(tokenB, endpointB, address(implB), EID_A, address(tokenA), sendLibB, receiveLibB, executorB, dvnsB);
        _assertTokenState(a);
        _assertLayerZeroConfig(a);
        _assertTokenState(b);
        _assertLayerZeroConfig(b);
    }

    function test_initialize_reverts_on_zero_address_empty_config_or_zero_min() public {
        IGLDT.InitParams memory p;

        p = initParams(EID_A, address(tokenB));
        p.adminSigner = address(0);
        _expectInitRevert(p, abi.encodeWithSelector(IGLDT.ZeroAddress.selector));

        p = initParams(EID_A, address(tokenB));
        p.icpSigner = address(0);
        _expectInitRevert(p, abi.encodeWithSelector(IGLDT.ZeroAddress.selector));

        p = initParams(EID_A, address(tokenB));
        p.operator = address(0);
        _expectInitRevert(p, abi.encodeWithSelector(IGLDT.ZeroAddress.selector));

        p = initParams(EID_A, address(tokenB));
        p.sendLib = address(0);
        _expectInitRevert(p, abi.encodeWithSelector(IGLDT.ZeroAddress.selector));

        p = initParams(EID_A, address(tokenB));
        p.receiveLib = address(0);
        _expectInitRevert(p, abi.encodeWithSelector(IGLDT.ZeroAddress.selector));

        p = initParams(EID_A, address(tokenB));
        p.peer = bytes32(0);
        _expectInitRevert(p, abi.encodeWithSelector(IGLDT.ZeroAddress.selector));

        p = initParams(EID_A, address(tokenB));
        p.sendConfig = new SetConfigParam[](0);
        _expectInitRevert(p, abi.encodeWithSelector(IGLDT.EmptyConfig.selector));

        p = initParams(EID_A, address(tokenB));
        p.receiveConfig = new SetConfigParam[](0);
        _expectInitRevert(p, abi.encodeWithSelector(IGLDT.EmptyConfig.selector));

        p = initParams(EID_A, address(tokenB));
        p.minBurnToIcp = 0;
        _expectInitRevert(p, abi.encodeWithSelector(IGLDT.ZeroMinBurn.selector));

        // The initializer uses the same gas bounds as setLzReceiveGas.
        p = initParams(EID_A, address(tokenB));
        p.lzReceiveGas = 99_999;
        _expectInitRevert(p, abi.encodeWithSelector(IGLDT.GasOutOfBounds.selector));

        // Control: the unchanged params deploy.
        GLDT fresh = deployToken(address(implA), initParams(EID_A, address(tokenB)));
        assertEq(fresh.owner(), address(fresh));
    }

    function test_implementation_cannot_be_initialized() public {
        vm.expectRevert(Initializable.InvalidInitialization.selector);
        implA.initialize(initParams(EID_A, address(tokenB)));

        // Nor can a proxy be initialized twice.
        vm.expectRevert(Initializable.InvalidInitialization.selector);
        tokenA.initialize(initParams(EID_A, address(tokenB)));
    }

    function test_initializer_emits_PeerSet_and_EnforcedOptionSet() public {
        address fresh = makeAddr("freshToken");
        EnforcedOptionParam[] memory expected = new EnforcedOptionParam[](1);
        expected[0] = EnforcedOptionParam(EID_B, 1, OptionsBuilder.newOptions().addExecutorLzReceiveOption(LZ_RECEIVE_GAS, 0));

        vm.expectEmit(fresh);
        emit IOAppCore.PeerSet(EID_B, addressToBytes32(address(tokenB)));
        vm.expectEmit(fresh);
        emit IOAppOptionsType3.EnforcedOptionSet(expected);
        deployTokenAt(fresh, address(implA), initParams(EID_A, address(tokenB)));
    }

    function test_setPaused_by_operator_and_by_self_only() public {
        vm.prank(stranger);
        vm.expectRevert(IGLDT.NotOperator.selector);
        tokenA.setPaused(true, true);

        // The signer keys are not the operator either.
        vm.prank(vm.addr(adminKey));
        vm.expectRevert(IGLDT.NotOperator.selector);
        tokenA.setPaused(true, true);

        vm.expectEmit(address(tokenA));
        emit IGLDT.PausedSet(true, false);
        vm.prank(operator);
        tokenA.setPaused(true, false);
        (bool lz, bool icp) = tokenA.paused();
        assertTrue(lz);
        assertFalse(icp);

        vm.expectEmit(address(tokenA));
        emit IGLDT.PausedSet(false, true);
        vm.prank(address(tokenA));
        tokenA.setPaused(false, true);
        (lz, icp) = tokenA.paused();
        assertFalse(lz);
        assertTrue(icp);

        // Each token has its own flags.
        (lz, icp) = tokenB.paused();
        assertFalse(lz);
        assertFalse(icp);
    }

    function test_setLzReceiveGas_bounds_and_value_zero() public {
        uint16 send = tokenA.SEND();
        // 100,000 covers the costliest first delivery (a fresh holder on a fresh path, about 81,000 gas).
        assertEq(tokenA.MIN_LZ_RECEIVE_GAS(), 100_000);
        assertEq(tokenA.MAX_LZ_RECEIVE_GAS(), 500_000);

        vm.prank(stranger);
        vm.expectRevert(IGLDT.NotOperator.selector);
        tokenA.setLzReceiveGas(EID_B, 200_000);

        vm.startPrank(operator);
        vm.expectRevert(IGLDT.GasOutOfBounds.selector);
        tokenA.setLzReceiveGas(EID_B, 99_999);
        vm.expectRevert(IGLDT.GasOutOfBounds.selector);
        tokenA.setLzReceiveGas(EID_B, 500_001);

        // Both bounds are inclusive.
        tokenA.setLzReceiveGas(EID_B, 100_000);
        assertEq(tokenA.enforcedOptions(EID_B, send), OptionsBuilder.newOptions().addExecutorLzReceiveOption(100_000, 0));
        tokenA.setLzReceiveGas(EID_B, 500_000);
        assertEq(tokenA.enforcedOptions(EID_B, send), OptionsBuilder.newOptions().addExecutorLzReceiveOption(500_000, 0));

        bytes memory expected = OptionsBuilder.newOptions().addExecutorLzReceiveOption(200_000, 0);
        EnforcedOptionParam[] memory params = new EnforcedOptionParam[](1);
        params[0] = EnforcedOptionParam(EID_B, send, expected);
        vm.expectEmit(address(tokenA));
        emit IOAppOptionsType3.EnforcedOptionSet(params);
        vm.expectEmit(address(tokenA));
        emit IGLDT.LzReceiveGasSet(EID_B, 200_000);
        tokenA.setLzReceiveGas(EID_B, 200_000);
        vm.stopPrank();

        bytes memory stored = tokenA.enforcedOptions(EID_B, send);
        assertEq(stored, expected);
        // Type 3, then one executor option: worker 1, length 17, type lzReceive, 16 bytes of gas, no value.
        assertEq(stored, abi.encodePacked(uint16(3), uint8(1), uint16(17), uint8(1), uint128(200_000)));
        (uint256 gas, uint256 value) = _parseExecutorLzReceiveOption(stored);
        assertEq(gas, 200_000);
        assertEq(value, 0);

        // Only SEND gets enforced options.
        assertEq(tokenA.enforcedOptions(EID_B, tokenA.SEND_AND_CALL()).length, 0);

        // The token itself may call it too.
        vm.prank(address(tokenA));
        tokenA.setLzReceiveGas(EID_B, 150_000);
        assertEq(tokenA.enforcedOptions(EID_B, send), OptionsBuilder.newOptions().addExecutorLzReceiveOption(150_000, 0));
    }

    function test_ownership_is_fixed() public {
        vm.prank(address(tokenA));
        vm.expectRevert(IGLDT.OwnershipFixed.selector);
        tokenA.transferOwnership(stranger);

        vm.prank(address(tokenA));
        vm.expectRevert(IGLDT.OwnershipFixed.selector);
        tokenA.renounceOwnership();

        vm.prank(stranger);
        vm.expectRevert(IGLDT.OwnershipFixed.selector);
        tokenA.transferOwnership(stranger);

        assertEq(tokenA.owner(), address(tokenA));

        // The operator holds no owner power.
        vm.startPrank(operator);
        vm.expectRevert(abi.encodeWithSelector(OwnableUpgradeable.OwnableUnauthorizedAccount.selector, operator));
        tokenA.setPeer(EID_B, addressToBytes32(stranger));
        vm.expectRevert(abi.encodeWithSelector(OwnableUpgradeable.OwnableUnauthorizedAccount.selector, operator));
        tokenA.setDelegate(operator);
        vm.expectRevert(abi.encodeWithSelector(OwnableUpgradeable.OwnableUnauthorizedAccount.selector, operator));
        tokenA.setEnforcedOptions(new EnforcedOptionParam[](0));
        vm.stopPrank();
    }

    function _expectInitRevert(IGLDT.InitParams memory p, bytes memory reason) private {
        vm.expectRevert(reason);
        deployToken(address(implA), p);
    }

    function _assertTokenState(Deployed memory c) private view {
        GLDT token = c.token;
        // Owner and LayerZero delegate are the token itself.
        assertEq(token.owner(), address(token));
        assertEq(c.ep.delegates(address(token)), address(token));
        assertEq(address(token.endpoint()), address(c.ep));
        assertEq(address(uint160(uint256(vm.load(address(token), ERC1967Utils.IMPLEMENTATION_SLOT)))), c.impl);

        // ERC-20 and OFT units.
        assertEq(token.name(), NAME);
        assertEq(token.symbol(), SYMBOL);
        assertEq(token.decimals(), 8);
        assertEq(token.sharedDecimals(), 8);
        assertEq(token.decimalConversionRate(), 1);

        // Bridge state.
        (uint64 next, uint256 supply, address owner_, address admin, address icp) = token.bridgeInfo();
        assertEq(next, 0);
        assertEq(supply, 0);
        assertEq(owner_, address(token));
        assertEq(admin, vm.addr(adminKey));
        assertEq(icp, vm.addr(icpKey));
        assertEq(token.adminSigner(), vm.addr(adminKey));
        assertEq(token.icpSigner(), vm.addr(icpKey));
        assertEq(token.operator(), operator);
        assertEq(token.minBurnToIcp(), 100_000_000);
        (bool lz, bool icpPaused) = token.paused();
        assertFalse(lz);
        assertFalse(icpPaused);

        // The ERC-7201 namespace starts with adminSigner.
        assertEq(address(uint160(uint256(vm.load(address(token), GLDT_STORAGE_SLOT)))), vm.addr(adminKey));
    }

    function _assertLayerZeroConfig(Deployed memory c) private view {
        address token = address(c.token);

        // Peer and enforced options.
        assertEq(c.token.peers(c.peerEid), addressToBytes32(c.peerToken));
        assertEq(
            c.token.enforcedOptions(c.peerEid, c.token.SEND()),
            OptionsBuilder.newOptions().addExecutorLzReceiveOption(LZ_RECEIVE_GAS, 0)
        );

        // Libraries are set explicitly, not taken from the endpoint defaults.
        assertEq(c.ep.getSendLibrary(token, c.peerEid), c.sendLib);
        assertFalse(c.ep.isDefaultSendLibrary(token, c.peerEid));
        (address lib, bool isDefault) = c.ep.getReceiveLibrary(token, c.peerEid);
        assertEq(lib, c.receiveLib);
        assertFalse(isDefault);

        // Executor config, read back through the endpoint.
        ExecutorConfig memory exec = abi.decode(
            c.ep.getConfig(token, c.sendLib, c.peerEid, CONFIG_TYPE_EXECUTOR),
            (ExecutorConfig)
        );
        assertEq(exec.maxMessageSize, MAX_MESSAGE_SIZE);
        assertEq(exec.executor, c.executor);

        // ULN config as the endpoint resolves it: our values, not the defaults.
        _assertResolvedUln(
            abi.decode(c.ep.getConfig(token, c.sendLib, c.peerEid, CONFIG_TYPE_ULN), (UlnConfig)),
            c.dvns
        );
        _assertResolvedUln(
            abi.decode(c.ep.getConfig(token, c.receiveLib, c.peerEid, CONFIG_TYPE_ULN), (UlnConfig)),
            c.dvns
        );

        // The stored app configs: every field explicit, none left at 0 (which means "use the default").
        _assertStoredUln(SendUln302Mock(payable(c.sendLib)).getAppUlnConfig(token, c.peerEid), c.dvns);
        _assertStoredUln(ReceiveUln302Mock(c.receiveLib).getAppUlnConfig(token, c.peerEid), c.dvns);
        (uint32 maxMessageSize, address executor) = SendUln302Mock(payable(c.sendLib)).executorConfigs(token, c.peerEid);
        assertEq(maxMessageSize, MAX_MESSAGE_SIZE);
        assertEq(executor, c.executor);
    }

    function _assertResolvedUln(UlnConfig memory c, address[] memory dvns) private pure {
        assertEq(c.confirmations, CONFIRMATIONS);
        assertEq(c.requiredDVNCount, 2);
        assertEq(c.requiredDVNs, dvns);
        // NIL optional DVNs resolve to none.
        assertEq(c.optionalDVNCount, 0);
        assertEq(c.optionalDVNThreshold, 0);
        assertEq(c.optionalDVNs.length, 0);
    }

    function _assertStoredUln(UlnConfig memory c, address[] memory dvns) private pure {
        assertEq(c.confirmations, CONFIRMATIONS);
        assertEq(c.requiredDVNCount, 2);
        assertEq(c.requiredDVNs, dvns);
        assertEq(c.optionalDVNCount, NIL_DVN_COUNT);
        assertEq(c.optionalDVNThreshold, 0);
        assertEq(c.optionalDVNs.length, 0);
    }
}
