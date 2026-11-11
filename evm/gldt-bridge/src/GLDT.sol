// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.28;

import { OFTUpgradeable } from "@layerzerolabs/oft-evm-upgradeable/contracts/oft/OFTUpgradeable.sol";
import { EnforcedOptionParam } from "@layerzerolabs/oapp-evm/contracts/oapp/interfaces/IOAppOptionsType3.sol";
import { IMessageLibManager } from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/IMessageLibManager.sol";
import { IMessagingChannel } from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/IMessagingChannel.sol";
import { ERC20PermitUpgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

import { IGLDT } from "./IGLDT.sol";
import { IcpPrincipal } from "./libs/IcpPrincipal.sol";

/// @title GLDT on Ethereum and Base
/// @notice LayerZero OFT behind a UUPS proxy. The token is its own owner and its own LayerZero delegate.
/// New tokens come only from LayerZero (the other EVM chain) or from vouchers signed by gldt_swap.
contract GLDT is IGLDT, OFTUpgradeable, ERC20PermitUpgradeable, UUPSUpgradeable {
    /// @custom:storage-location erc7201:gldt.storage.GLDT
    struct GLDTStorage {
        address adminSigner;
        address icpSigner;
        address operator;
        bool lzPaused;
        bool icpBridgePaused;
        mapping(uint256 => bool) usedNonce;
        mapping(uint64 => bool) claimed;
        uint64 nextBurnId;
        uint256 minBurnToIcp;
        address upgradeAllowed;
    }

    // keccak256(abi.encode(uint256(keccak256("gldt.storage.GLDT")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant GLDT_STORAGE_LOCATION = 0x3084c67bbad50587897ca408b5a5f48944d58a2de470a5f329e23869660eeb00;

    bytes32 public constant CLAIM_TYPEHASH = keccak256("Claim(uint64 icpBurnIndex,address recipient,uint256 amount)");
    bytes32 public constant CALL_TYPEHASH = keccak256("Call(address target,bytes data)");
    bytes32 public constant EXECUTE_TYPEHASH =
        keccak256("Execute(Call[] calls,uint256 nonce,uint256 deadline)Call(address target,bytes data)");

    /// @dev The costliest delivery, the first one to a fresh holder on a fresh path, takes about 81,000 gas.
    uint128 public constant MIN_LZ_RECEIVE_GAS = 100_000;
    uint128 public constant MAX_LZ_RECEIVE_GAS = 500_000;

    // Type 3 executor option encoding (LayerZero ExecutorOptions and OptionsBuilder).
    uint16 private constant OPTIONS_TYPE_3 = 3;
    uint8 private constant EXECUTOR_WORKER_ID = 1;
    uint8 private constant OPTION_TYPE_LZRECEIVE = 1;
    uint16 private constant LZRECEIVE_GAS_ONLY_SIZE = 17; // option type byte plus 16 bytes of gas, no value

    modifier onlyOperatorOrSelf() {
        _checkOperatorOrSelf();
        _;
    }

    /// @dev The token itself, which means a call made by `execute`.
    modifier onlySelf() {
        _checkSelf();
        _;
    }

    /// @dev The endpoint is an immutable of the implementation, the same address on Ethereum and Base.
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(address lzEndpoint) OFTUpgradeable(lzEndpoint) {
        _disableInitializers();
    }

    // OpenZeppelin's upgrade check expects direct calls to __OAppSender_init and __OAppReceiver_init. LayerZero's
    // __OApp_init runs only their empty _unchained parts, the full ones only repeat __OAppCore_init (a duplicate
    // call), and neither contract has state. So that one finding is allowed here, for this function only.
    /// @inheritdoc IGLDT
    /// @custom:oz-upgrades-unsafe-allow missing-initializer-call
    function initialize(InitParams calldata p) external initializer {
        if (
            p.adminSigner == address(0) ||
            p.icpSigner == address(0) ||
            p.operator == address(0) ||
            p.sendLib == address(0) ||
            p.receiveLib == address(0) ||
            p.peer == bytes32(0)
        ) revert ZeroAddress();
        if (p.sendConfig.length == 0 || p.receiveConfig.length == 0) revert EmptyConfig();
        if (p.minBurnToIcp == 0) revert ZeroMinBurn();

        // 1 to 3: ERC-20, OFT with the token as delegate, owner, UUPS, and the EIP-712 domain ("Gold Token", "1").
        __OFT_init(p.name, p.symbol, address(this));
        __Ownable_init(address(this));
        __UUPSUpgradeable_init();
        __ERC20Permit_init(p.name);

        // 4: every LayerZero setting explicit. The endpoint accepts these calls from the OApp itself.
        endpoint.setSendLibrary(address(this), p.peerEid, p.sendLib);
        endpoint.setReceiveLibrary(address(this), p.peerEid, p.receiveLib, 0);
        endpoint.setConfig(address(this), p.sendLib, p.sendConfig);
        endpoint.setConfig(address(this), p.receiveLib, p.receiveConfig);

        // 5 and 6: setPeer and setEnforcedOptions are owner only, and the initializer does not run as owner.
        _writePeer(p.peerEid, p.peer);
        _writeLzReceiveGas(p.peerEid, p.lzReceiveGas);

        // 7: signers, operator and minimum burn. 8: nothing is paused.
        GLDTStorage storage $ = _getGLDTStorage();
        $.adminSigner = p.adminSigner;
        $.icpSigner = p.icpSigner;
        $.operator = p.operator;
        $.minBurnToIcp = p.minBurnToIcp;
    }

    // User functions

    /// @inheritdoc IGLDT
    function claimFromIcp(
        uint64 icpBurnIndex,
        address recipient,
        uint256 amount,
        bytes calldata signature
    ) external {
        GLDTStorage storage $ = _getGLDTStorage();
        if ($.icpBridgePaused) revert PathPaused();
        if ($.claimed[icpBurnIndex]) revert AlreadyClaimed();
        if (recipient == address(0)) revert ZeroAddress();

        // The domain has chainId and the proxy address, so a voucher for one chain fails on the other.
        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(CLAIM_TYPEHASH, icpBurnIndex, recipient, amount)));
        // OpenZeppelin rejects high s, so gldt_swap normalizes s before it hands out a voucher.
        if (ECDSA.recover(digest, signature) != $.icpSigner) revert BadSignature();

        $.claimed[icpBurnIndex] = true;
        _mint(recipient, amount);
        emit ClaimedFromIcp(icpBurnIndex, recipient, amount);
    }

    /// @inheritdoc IGLDT
    function burnToIcp(uint256 amount, bytes32 icpPrincipal, bytes32 icpSubaccount) external returns (uint64 burnId) {
        GLDTStorage storage $ = _getGLDTStorage();
        if ($.icpBridgePaused) revert PathPaused();
        uint256 min = $.minBurnToIcp;
        if (amount < min) revert BelowMinimum(min);
        if (!IcpPrincipal.isValid(icpPrincipal)) revert BadIcpPrincipal();

        _burn(msg.sender, amount);
        burnId = $.nextBurnId++;
        emit BurnedToIcp(burnId, msg.sender, icpPrincipal, icpSubaccount, amount);
    }

    // Operator functions

    /// @inheritdoc IGLDT
    function pause(bool lzPaused, bool icpBridgePaused) external onlyOperatorOrSelf {
        GLDTStorage storage $ = _getGLDTStorage();
        bool newLz = $.lzPaused || lzPaused;
        bool newIcp = $.icpBridgePaused || icpBridgePaused;
        // Nothing changes: no write, no event.
        if (newLz == $.lzPaused && newIcp == $.icpBridgePaused) return;
        _writePaused(newLz, newIcp);
    }

    /// @inheritdoc IGLDT
    function setLzReceiveGas(uint32 dstEid, uint128 gas) external onlyOperatorOrSelf {
        _writeLzReceiveGas(dstEid, gas);
        emit LzReceiveGasSet(dstEid, gas);
    }

    // Admin actions

    /// @inheritdoc IGLDT
    function execute(Call[] calldata calls, uint256 nonce, uint256 deadline, bytes calldata signature) external {
        if (block.timestamp > deadline) revert Expired();
        GLDTStorage storage $ = _getGLDTStorage();
        if ($.usedNonce[nonce]) revert NonceUsed();
        // Same domain as vouchers and permits; the type and the key keep them apart.
        bytes32 digest = hashExecute(calls, nonce, deadline);
        if (ECDSA.recover(digest, signature) != $.adminSigner) revert BadSignature();
        uint256 count = calls.length;
        for (uint256 i = 0; i < count; ++i) {
            _checkTarget(i, calls[i]);
        }

        // Marked before any call runs, so no call (an inner execute included) can run this action again.
        // A failed call reverts everything, this line too, so an action only counts as used once it all worked.
        $.usedNonce[nonce] = true;
        for (uint256 i = 0; i < count; ++i) {
            (bool ok, bytes memory reason) = calls[i].target.call(calls[i].data);
            if (!ok) revert CallFailed(i, reason);
        }
        emit Executed(nonce, digest);
    }

    /// @inheritdoc IGLDT
    function setPaused(bool lzPaused, bool icpBridgePaused) external onlySelf {
        _writePaused(lzPaused, icpBridgePaused);
    }

    /// @inheritdoc IGLDT
    function setOperator(address newOperator) external onlySelf {
        _getGLDTStorage().operator = newOperator;
        emit OperatorSet(newOperator);
    }

    /// @inheritdoc IGLDT
    function setIcpSigner(address signer) external onlySelf {
        if (signer == address(0)) revert ZeroAddress();
        _getGLDTStorage().icpSigner = signer;
        emit IcpSignerSet(signer);
    }

    /// @inheritdoc IGLDT
    function setAdminSigner(address signer) external onlySelf {
        // Zero would lock execute, and with it every upgrade and setting, for good.
        if (signer == address(0)) revert ZeroAddress();
        _getGLDTStorage().adminSigner = signer;
        emit AdminSignerSet(signer);
    }

    /// @inheritdoc IGLDT
    function setMinBurnToIcp(uint256 amount) external onlySelf {
        if (amount == 0) revert ZeroMinBurn();
        _getGLDTStorage().minBurnToIcp = amount;
        emit MinBurnToIcpSet(amount);
    }

    /// @inheritdoc IGLDT
    function upgradeExact(address implementation, bytes32 codeHash) external onlySelf {
        if (implementation.codehash != codeHash) revert CodeHashMismatch();
        GLDTStorage storage $ = _getGLDTStorage();
        // _authorizeUpgrade accepts exactly this implementation, and only while this call runs.
        $.upgradeAllowed = implementation;
        upgradeToAndCall(implementation, "");
        $.upgradeAllowed = address(0);
    }

    /// @inheritdoc IGLDT
    function cancelNonce(uint256 nonce) external onlySelf {
        GLDTStorage storage $ = _getGLDTStorage();
        // Only a live nonce can be cancelled, so NonceCancelled never shows up for an action that ran.
        if ($.usedNonce[nonce]) revert NonceUsed();
        $.usedNonce[nonce] = true;
        emit NonceCancelled(nonce);
    }

    // Views

    /// @inheritdoc IGLDT
    function hashExecute(Call[] calldata calls, uint256 nonce, uint256 deadline) public view returns (bytes32) {
        bytes32[] memory callHashes = new bytes32[](calls.length);
        for (uint256 i = 0; i < calls.length; ++i) {
            callHashes[i] = keccak256(abi.encode(CALL_TYPEHASH, calls[i].target, keccak256(calls[i].data)));
        }
        return
            _hashTypedDataV4(
                keccak256(abi.encode(EXECUTE_TYPEHASH, keccak256(abi.encodePacked(callHashes)), nonce, deadline))
            );
    }

    /// @inheritdoc IGLDT
    function usedNonce(uint256 nonce) external view returns (bool) {
        return _getGLDTStorage().usedNonce[nonce];
    }

    /// @inheritdoc IGLDT
    function bridgeInfo() external view returns (uint64, uint256, address, address, address) {
        GLDTStorage storage $ = _getGLDTStorage();
        return ($.nextBurnId, totalSupply(), owner(), $.adminSigner, $.icpSigner);
    }

    /// @inheritdoc IGLDT
    function paused() external view returns (bool lzPaused, bool icpBridgePaused) {
        GLDTStorage storage $ = _getGLDTStorage();
        return ($.lzPaused, $.icpBridgePaused);
    }

    /// @inheritdoc IGLDT
    function operator() external view returns (address) {
        return _getGLDTStorage().operator;
    }

    /// @inheritdoc IGLDT
    function adminSigner() external view returns (address) {
        return _getGLDTStorage().adminSigner;
    }

    /// @inheritdoc IGLDT
    function icpSigner() external view returns (address) {
        return _getGLDTStorage().icpSigner;
    }

    /// @inheritdoc IGLDT
    function minBurnToIcp() external view returns (uint256) {
        return _getGLDTStorage().minBurnToIcp;
    }

    /// @inheritdoc IGLDT
    function isClaimed(uint64 icpBurnIndex) external view returns (bool) {
        return _getGLDTStorage().claimed[icpBurnIndex];
    }

    /// @inheritdoc IGLDT
    function nextBurnId() external view returns (uint64) {
        return _getGLDTStorage().nextBurnId;
    }

    // Overrides

    /// @notice 8 decimals, like GLDT on ICP, so amounts map 1:1.
    function decimals() public pure override returns (uint8) {
        return 8;
    }

    /// @notice 8 shared decimals, so LayerZero transfers lose no dust.
    function sharedDecimals() public pure override returns (uint8) {
        return 8;
    }

    /// @notice Always reverts: the token stays its own owner.
    function transferOwnership(address) public pure override {
        revert OwnershipFixed();
    }

    /// @notice Always reverts: the token stays its own owner.
    function renounceOwnership() public pure override {
        revert OwnershipFixed();
    }

    /// @dev Passes only inside upgradeExact: the token itself, upgrading to the implementation it allowed.
    /// Outside upgradeExact upgradeAllowed is zero, and zero never passes.
    function _authorizeUpgrade(address newImplementation) internal view override {
        address allowed = _getGLDTStorage().upgradeAllowed;
        if (msg.sender != address(this) || allowed == address(0) || newImplementation != allowed) {
            revert UpgradeNotAllowed();
        }
    }

    /// @dev LayerZero send burns here; stopped while lzPaused.
    function _debit(
        address from,
        uint256 amountLD,
        uint256 minAmountLD,
        uint32 dstEid
    ) internal override returns (uint256 amountSentLD, uint256 amountReceivedLD) {
        if (_getGLDTStorage().lzPaused) revert PathPaused();
        return super._debit(from, amountLD, minAmountLD, dstEid);
    }

    /// @dev LayerZero receive mints here; stopped while lzPaused. The endpoint keeps a rejected message
    /// verified, so anyone can replay it with endpoint.lzReceive after the unpause.
    function _credit(address to, uint256 amountLD, uint32 srcEid) internal override returns (uint256) {
        if (_getGLDTStorage().lzPaused) revert PathPaused();
        return super._credit(to, amountLD, srcEid);
    }

    // Private helpers

    function _checkOperatorOrSelf() private view {
        if (msg.sender != _getGLDTStorage().operator && msg.sender != address(this)) revert NotOperator();
    }

    function _checkSelf() private view {
        if (msg.sender != address(this)) revert NotSelf();
    }

    /// @dev A call may target the token itself (any function), or the LayerZero endpoint with one of four
    /// ILayerZeroEndpointV2 selectors, declared in its parents IMessageLibManager and IMessagingChannel.
    /// Calls carry no ETH, so no target can be paid.
    function _checkTarget(uint256 index, Call calldata c) private view {
        address target = c.target;
        if (target == address(this)) return;
        if (target == address(endpoint) && c.data.length >= 4) {
            bytes4 selector = bytes4(c.data[:4]);
            if (
                selector == IMessageLibManager.setConfig.selector ||
                selector == IMessageLibManager.setSendLibrary.selector ||
                selector == IMessageLibManager.setReceiveLibrary.selector ||
                selector == IMessagingChannel.burn.selector
            ) return;
        }
        revert TargetNotAllowed(index);
    }

    /// @dev setPeer without the owner check, for the initializer.
    function _writePeer(uint32 eid, bytes32 peer) private {
        _getOAppCoreStorage().peers[eid] = peer;
        emit PeerSet(eid, peer);
    }

    function _writePaused(bool lzPaused, bool icpBridgePaused) private {
        GLDTStorage storage $ = _getGLDTStorage();
        $.lzPaused = lzPaused;
        $.icpBridgePaused = icpBridgePaused;
        emit PausedSet(lzPaused, icpBridgePaused);
    }

    /// @dev Enforced options for SEND: one lzReceive option with `gas` and value 0, within the fixed bounds.
    /// The operator never gets raw setEnforcedOptions, which could add a native drop to every send.
    function _writeLzReceiveGas(uint32 eid, uint128 gas) private {
        if (gas < MIN_LZ_RECEIVE_GAS || gas > MAX_LZ_RECEIVE_GAS) revert GasOutOfBounds();
        bytes memory options = abi.encodePacked(
            OPTIONS_TYPE_3,
            EXECUTOR_WORKER_ID,
            LZRECEIVE_GAS_ONLY_SIZE,
            OPTION_TYPE_LZRECEIVE,
            gas
        );
        _getOAppOptionsType3Storage().enforcedOptions[eid][SEND] = options;
        EnforcedOptionParam[] memory params = new EnforcedOptionParam[](1);
        params[0] = EnforcedOptionParam(eid, SEND, options);
        emit EnforcedOptionSet(params);
    }

    function _getGLDTStorage() private pure returns (GLDTStorage storage $) {
        assembly {
            $.slot := GLDT_STORAGE_LOCATION
        }
    }
}
