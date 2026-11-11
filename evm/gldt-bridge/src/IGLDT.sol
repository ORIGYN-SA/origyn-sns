// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.28;

import { SetConfigParam } from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/IMessageLibManager.sol";

/// @title GLDT bridge interface
/// @notice Structs, events, errors and the GLDT specific functions of the token.
/// The inherited LayerZero OFT, ERC-20, EIP-2612 and UUPS functions are not repeated here.
interface IGLDT {
    /// @notice Everything `initialize` sets, inside the proxy deployment.
    struct InitParams {
        string name; // "Gold Token"
        string symbol; // "GLDT"
        address adminSigner; // gldt_swap admin key address
        address icpSigner; // gldt_swap claims key address
        address operator; // the operator wallet
        uint32 peerEid; // the other chain: 30101 Ethereum, 30184 Base
        bytes32 peer; // the token on the other chain, as bytes32
        address sendLib; // SendUln302 on this chain
        address receiveLib; // ReceiveUln302 on this chain
        SetConfigParam[] sendConfig; // executor config (type 1) and ULN config (type 2), every field explicit
        SetConfigParam[] receiveConfig; // ULN config (type 2), every field explicit
        uint128 lzReceiveGas;
        uint256 minBurnToIcp; // 100_000_000 (1 GLDT with 8 decimals)
    }

    /// @notice One call inside an admin action signed by gldt_swap.
    struct Call {
        address target;
        bytes data;
    }

    event ClaimedFromIcp(uint64 indexed icpBurnIndex, address indexed recipient, uint256 amount);
    event BurnedToIcp(
        uint64 indexed burnId,
        address indexed from,
        bytes32 icpPrincipal,
        bytes32 icpSubaccount,
        uint256 amount
    );
    event PausedSet(bool lzPaused, bool icpBridgePaused);
    event LzReceiveGasSet(uint32 dstEid, uint128 gas);
    event OperatorSet(address operator);
    event IcpSignerSet(address signer);
    event AdminSignerSet(address signer);
    event MinBurnToIcpSet(uint256 amount);
    event Executed(uint256 indexed nonce, bytes32 digest);
    event NonceCancelled(uint256 indexed nonce);

    error PathPaused();
    error AlreadyClaimed();
    error BadSignature();
    error ZeroAddress();
    error BadIcpPrincipal();
    error BelowMinimum(uint256 min);
    error NotOperator();
    error GasOutOfBounds();
    error Expired();
    error NonceUsed();
    error TargetNotAllowed(uint256 index);
    error CallFailed(uint256 index, bytes reason);
    error NotSelf();
    error CodeHashMismatch();
    error UpgradeNotAllowed();
    error OwnershipFixed();
    /// @notice `initialize` got an empty `sendConfig` or `receiveConfig`.
    error EmptyConfig();
    /// @notice `minBurnToIcp` must be above 0.
    error ZeroMinBurn();

    /// @notice One time setup, run by the proxy constructor.
    function initialize(InitParams calldata p) external;

    /// @notice Mints `amount` to `recipient` for an ICP burn, with a voucher signed by the claims key.
    /// Anyone may submit it. Each ICP burn index claims once.
    function claimFromIcp(uint64 icpBurnIndex, address recipient, uint256 amount, bytes calldata signature) external;

    /// @notice Burns the caller's `amount` for the ICP account (`icpPrincipal`, `icpSubaccount`).
    /// gldt_swap finds the burn by its id and mints on ICP.
    function burnToIcp(uint256 amount, bytes32 icpPrincipal, bytes32 icpSubaccount) external returns (uint64 burnId);

    /// @notice Operator or the token itself: turns on each pause passed as true and leaves the other flag as it
    /// is. It never turns a pause off; only `setPaused`, through an SNS-voted `execute`, does.
    function pause(bool lzPaused, bool icpBridgePaused) external;

    /// @notice Only the token itself (so only through `execute`): sets both pause flags, on or off.
    function setPaused(bool lzPaused, bool icpBridgePaused) external;

    /// @notice Operator or the token itself: sets the enforced lzReceive gas for `dstEid`, value always 0.
    function setLzReceiveGas(uint32 dstEid, uint128 gas) external;

    /// @notice Runs `calls` signed by the admin key (gldt_swap, after an ORIGYN SNS vote). Anyone may submit
    /// it. Each call targets the token itself, or the LayerZero endpoint with setConfig, setSendLibrary,
    /// setReceiveLibrary or burn. If any call fails the whole batch reverts and the nonce stays unused.
    function execute(Call[] calldata calls, uint256 nonce, uint256 deadline, bytes calldata signature) external;

    /// @notice Only the token itself (so only through `execute`): replaces the operator, or removes it with zero.
    function setOperator(address newOperator) external;

    /// @notice Only the token itself: replaces the key that signs claim vouchers. Never zero.
    function setIcpSigner(address signer) external;

    /// @notice Only the token itself: replaces the key that signs `execute`, which moves control of the token
    /// to a new key. Never zero.
    function setAdminSigner(address signer) external;

    /// @notice Only the token itself: the smallest `burnToIcp`, above 0.
    function setMinBurnToIcp(uint256 amount) external;

    /// @notice Only the token itself: upgrades to `implementation`, only if its code hash is `codeHash`.
    function upgradeExact(address implementation, bytes32 codeHash) external;

    /// @notice Only the token itself: marks an unused nonce as used, so the action signed for it can never run.
    function cancelNonce(uint256 nonce) external;

    /// @notice Everything the canister reads each tick, in one call.
    function bridgeInfo()
        external
        view
        returns (uint64 nextBurnId, uint256 totalSupply, address owner, address adminSigner, address icpSigner);

    function paused() external view returns (bool lzPaused, bool icpBridgePaused);

    function operator() external view returns (address);

    function adminSigner() external view returns (address);

    function icpSigner() external view returns (address);

    function minBurnToIcp() external view returns (uint256);

    function isClaimed(uint64 icpBurnIndex) external view returns (bool);

    /// @notice The id the next `burnToIcp` gets. Ids start at 0 and have no gaps.
    function nextBurnId() external view returns (uint64);

    /// @notice True once `nonce` ran in `execute` or was cancelled. Separate from the permit `nonces(owner)`.
    function usedNonce(uint256 nonce) external view returns (bool);

    /// @notice The EIP-712 digest the admin key signs for these arguments, over the token's own domain.
    function hashExecute(Call[] calldata calls, uint256 nonce, uint256 deadline) external view returns (bytes32);

    /// @notice keccak256("Claim(uint64 icpBurnIndex,address recipient,uint256 amount)")
    function CLAIM_TYPEHASH() external view returns (bytes32);

    /// @notice keccak256("Execute(Call[] calls,uint256 nonce,uint256 deadline)Call(address target,bytes data)")
    function EXECUTE_TYPEHASH() external view returns (bytes32);

    /// @notice keccak256("Call(address target,bytes data)")
    function CALL_TYPEHASH() external view returns (bytes32);
}
