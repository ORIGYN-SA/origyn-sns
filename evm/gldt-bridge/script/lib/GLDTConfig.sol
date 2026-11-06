// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.28;

import { CommonBase } from "forge-std/Base.sol";
import { UlnConfig } from "@layerzerolabs/lz-evm-messagelib-v2/contracts/uln/UlnBase.sol";
import { ExecutorConfig } from "@layerzerolabs/lz-evm-messagelib-v2/contracts/SendLibBase.sol";
import { SetConfigParam } from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/IMessageLibManager.sol";

import { IGLDT } from "../../src/IGLDT.sol";

/// @notice One chain's deploy settings, read from script/config/<chain>.json.
struct GLDTConfig {
    string chain;
    uint256 chainId;
    uint32 eid;
    address endpoint;
    uint32 peerEid;
    address sendLib;
    address receiveLib;
    // send config: executor (type 1) and ULN (type 2) for messages to peerEid
    address executor;
    uint32 maxMessageSize;
    uint64 sendConfirmations;
    address[] sendDVNs;
    // receive config: ULN (type 2) for messages from peerEid
    uint64 receiveConfirmations;
    address[] receiveDVNs;
    uint128 lzReceiveGas;
    address operator;
    address adminSigner;
    address icpSigner;
    bytes32 salt;
    string name;
    string symbol;
}

/// @notice What Deploy writes to deployments/<chain>.json and Check reads back.
struct GLDTDeployment {
    uint256 chainId;
    address proxy;
    address implementation;
    bytes32 implementationCodeHash;
    uint256 blockNumber;
}

/// @dev UlnBase.getAppUlnConfig returns what the OApp stored, getUlnConfig the result merged with the defaults.
interface IUlnConfigReader {
    function getAppUlnConfig(address oapp, uint32 remoteEid) external view returns (UlnConfig memory);

    function getUlnConfig(address oapp, uint32 remoteEid) external view returns (UlnConfig memory);
}

/// @dev SendLibBase.executorConfigs is the stored value, getExecutorConfig the merged one.
interface IExecutorConfigReader {
    function executorConfigs(address oapp, uint32 remoteEid) external view returns (uint32, address);

    function getExecutorConfig(address oapp, uint32 remoteEid) external view returns (ExecutorConfig memory);
}

/// @dev EndpointV2's public `delegates` mapping, which ILayerZeroEndpointV2 does not declare.
interface IEndpointDelegates {
    function delegates(address oapp) external view returns (address);
}

/// @dev CreateX (https://github.com/pcaversaccio/createx), the same address on every chain it is on.
interface ICreateX {
    function deployCreate3(bytes32 salt, bytes memory initCode) external payable returns (address newContract);

    function computeCreate3Address(bytes32 salt) external view returns (address computedAddress);
}

/// @notice Reads the config and deployment files and builds InitParams, for Deploy, Check and the fork test.
abstract contract GLDTConfigReader is CommonBase {
    address internal constant CREATEX = 0xba5Ed099633D3B313e4D5F7bdc1305d3c28ba5Ed;
    uint256 internal constant MIN_BURN_TO_ICP = 100_000_000; // 1 GLDT with 8 decimals (spec 6.2)
    string internal constant TOKEN_NAME = "Gold Token"; // also the EIP-712 domain name gldt_swap signs with
    string internal constant TOKEN_SYMBOL = "GLDT";
    uint32 internal constant CONFIG_TYPE_EXECUTOR = 1;
    uint32 internal constant CONFIG_TYPE_ULN = 2;
    uint8 internal constant NIL_DVN_COUNT = type(uint8).max; // no optional DVNs (0 would mean the default)
    bytes32 internal constant ERC1967_IMPLEMENTATION_SLOT =
        0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;

    function _loadConfig(string memory path) internal view returns (GLDTConfig memory c) {
        string memory j = vm.readFile(path);
        c.chain = vm.parseJsonString(j, ".chain");
        c.chainId = vm.parseJsonUint(j, ".chainId");
        c.eid = _u32(j, ".eid");
        c.endpoint = vm.parseJsonAddress(j, ".endpoint");
        c.peerEid = _u32(j, ".peerEid");
        c.sendLib = vm.parseJsonAddress(j, ".sendLib");
        c.receiveLib = vm.parseJsonAddress(j, ".receiveLib");
        c.executor = vm.parseJsonAddress(j, ".sendConfig.executor");
        c.maxMessageSize = _u32(j, ".sendConfig.maxMessageSize");
        c.sendConfirmations = _u64(j, ".sendConfig.confirmations");
        c.sendDVNs = vm.parseJsonAddressArray(j, ".sendConfig.requiredDVNs");
        c.receiveConfirmations = _u64(j, ".receiveConfig.confirmations");
        c.receiveDVNs = vm.parseJsonAddressArray(j, ".receiveConfig.requiredDVNs");
        uint256 gas = vm.parseJsonUint(j, ".lzReceiveGas");
        require(gas <= type(uint128).max, "lzReceiveGas too large");
        c.lzReceiveGas = uint128(gas);
        c.operator = vm.parseJsonAddress(j, ".operator");
        c.adminSigner = vm.parseJsonAddress(j, ".adminSigner");
        c.icpSigner = vm.parseJsonAddress(j, ".icpSigner");
        c.salt = vm.parseJsonBytes32(j, ".salt");
        c.name = vm.parseJsonString(j, ".name");
        c.symbol = vm.parseJsonString(j, ".symbol");
    }

    function _loadDeployment(string memory path) internal view returns (GLDTDeployment memory d) {
        string memory j = vm.readFile(path);
        d.chainId = vm.parseJsonUint(j, ".chainId");
        d.proxy = vm.parseJsonAddress(j, ".proxy");
        d.implementation = vm.parseJsonAddress(j, ".implementation");
        d.implementationCodeHash = vm.parseJsonBytes32(j, ".implementationCodeHash");
        d.blockNumber = vm.parseJsonUint(j, ".block");
    }

    /// @notice The initializer arguments for this chain, with `peer` as the token on the other chain.
    function _initParams(GLDTConfig memory c, address peer) internal pure returns (IGLDT.InitParams memory p) {
        SetConfigParam[] memory sendConfig = new SetConfigParam[](2);
        sendConfig[0] = SetConfigParam(
            c.peerEid,
            CONFIG_TYPE_EXECUTOR,
            abi.encode(ExecutorConfig(c.maxMessageSize, c.executor))
        );
        sendConfig[1] = SetConfigParam(c.peerEid, CONFIG_TYPE_ULN, abi.encode(_uln(c.sendConfirmations, c.sendDVNs)));
        SetConfigParam[] memory receiveConfig = new SetConfigParam[](1);
        receiveConfig[0] = SetConfigParam(
            c.peerEid,
            CONFIG_TYPE_ULN,
            abi.encode(_uln(c.receiveConfirmations, c.receiveDVNs))
        );
        p = IGLDT.InitParams({
            name: c.name,
            symbol: c.symbol,
            adminSigner: c.adminSigner,
            icpSigner: c.icpSigner,
            operator: c.operator,
            peerEid: c.peerEid,
            peer: bytes32(uint256(uint160(peer))),
            sendLib: c.sendLib,
            receiveLib: c.receiveLib,
            sendConfig: sendConfig,
            receiveConfig: receiveConfig,
            lzReceiveGas: c.lzReceiveGas,
            minBurnToIcp: MIN_BURN_TO_ICP
        });
    }

    /// @notice Every ULN field explicit: only required DVNs, optional count NIL and threshold 0 (spec 6.11).
    function _uln(uint64 confirmations, address[] memory dvns) internal pure returns (UlnConfig memory) {
        return
            UlnConfig({
                confirmations: confirmations,
                requiredDVNCount: uint8(dvns.length),
                optionalDVNCount: NIL_DVN_COUNT,
                optionalDVNThreshold: 0,
                requiredDVNs: dvns,
                optionalDVNs: new address[](0)
            });
    }

    /// @notice True if `dvns` is not empty, has no zero address and is strictly ascending (ULN302's rule).
    function _sortedDvns(address[] memory dvns) internal pure returns (bool) {
        if (dvns.length == 0 || dvns[0] == address(0)) return false;
        for (uint256 i = 1; i < dvns.length; i++) {
            if (dvns[i] <= dvns[i - 1]) return false;
        }
        return true;
    }

    function _u32(string memory j, string memory key) private pure returns (uint32) {
        uint256 v = vm.parseJsonUint(j, key);
        require(v <= type(uint32).max, string.concat(key, " does not fit uint32"));
        return uint32(v);
    }

    function _u64(string memory j, string memory key) private pure returns (uint64) {
        uint256 v = vm.parseJsonUint(j, key);
        require(v <= type(uint64).max, string.concat(key, " does not fit uint64"));
        return uint64(v);
    }
}
