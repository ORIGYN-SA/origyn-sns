// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.28;

import { OFTUpgradeable } from "@layerzerolabs/oft-evm-upgradeable/contracts/oft/OFTUpgradeable.sol";
import { EnforcedOptionParam } from "@layerzerolabs/oapp-evm/contracts/oapp/interfaces/IOAppOptionsType3.sol";
import { ERC20PermitUpgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import { IGLDT } from "./IGLDT.sol";

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

    uint128 public constant MIN_LZ_RECEIVE_GAS = 60_000;
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

    /// @dev The endpoint is an immutable of the implementation, the same address on Ethereum and Base.
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(address lzEndpoint) OFTUpgradeable(lzEndpoint) {
        _disableInitializers();
    }

    /// @inheritdoc IGLDT
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

    // Operator functions (spec 6.5)

    /// @inheritdoc IGLDT
    function setPaused(bool lzPaused, bool icpBridgePaused) external onlyOperatorOrSelf {
        GLDTStorage storage $ = _getGLDTStorage();
        $.lzPaused = lzPaused;
        $.icpBridgePaused = icpBridgePaused;
        emit PausedSet(lzPaused, icpBridgePaused);
    }

    /// @inheritdoc IGLDT
    function setLzReceiveGas(uint32 dstEid, uint128 gas) external onlyOperatorOrSelf {
        _writeLzReceiveGas(dstEid, gas);
        emit LzReceiveGasSet(dstEid, gas);
    }

    // Views (spec 6.8)

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

    // Overrides (spec 6.7)

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

    /// @dev Passes only for the token itself, upgrading to the implementation upgradeExact allowed (spec 6.6).
    function _authorizeUpgrade(address newImplementation) internal view override {
        if (msg.sender != address(this) || newImplementation != _getGLDTStorage().upgradeAllowed) {
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

    /// @dev setPeer without the owner check, for the initializer.
    function _writePeer(uint32 eid, bytes32 peer) private {
        _getOAppCoreStorage().peers[eid] = peer;
        emit PeerSet(eid, peer);
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
