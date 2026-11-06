// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.28;

import { console2 } from "forge-std/console2.sol";
import { ERC1967Proxy } from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { UlnConfig } from "@layerzerolabs/lz-evm-messagelib-v2/contracts/uln/UlnBase.sol";
import { ExecutorConfig } from "@layerzerolabs/lz-evm-messagelib-v2/contracts/SendLibBase.sol";
import { ILayerZeroEndpointV2 } from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/ILayerZeroEndpointV2.sol";
import { SendParam, MessagingFee } from "@layerzerolabs/oft-evm/contracts/interfaces/IOFT.sol";

import { GLDT } from "../../src/GLDT.sol";
import { IGLDT } from "../../src/IGLDT.sol";
import { GLDTConfig, GLDTDeployment, GLDTConfigReader, IUlnConfigReader, IExecutorConfigReader, IEndpointDelegates } from "./GLDTConfig.sol";

/// @notice Every check of spec 7.3, one PASS or FAIL line each. Returns the number of FAIL lines.
/// Check.s.sol runs it against a live chain; the fork test and Scripts.t.sol run it in process.
abstract contract GLDTCheckCore is GLDTConfigReader {
    // OpenZeppelin's Initializable namespace:
    // keccak256(abi.encode(uint256(keccak256("openzeppelin.storage.Initializable")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant INITIALIZABLE_SLOT = 0xf0c57e16840df040f15088dc2f81fe391c3923bec73e23a9662efc9c229c6a00;
    bytes32 private constant EIP712_DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    uint16 private constant SEND = 1; // OFT msgType for a plain send

    uint256 private _passed;
    uint256 private _failed;

    /// @param expectedPeer the token on the other chain: the same address as `d.proxy` on mainnet.
    function _checkGLDT(
        GLDTConfig memory c,
        GLDTDeployment memory d,
        address expectedPeer
    ) internal returns (uint256 failed) {
        _passed = 0;
        _failed = 0;
        console2.log(
            string.concat("GLDT ", vm.toString(d.proxy), " on ", c.chain, ", chain id ", vm.toString(c.chainId))
        );

        _eq("chain id is the config's", block.chainid, c.chainId);
        _eq("deployment file is for this chain id", d.chainId, c.chainId);
        _ok("proxy has code", d.proxy.code.length > 0, "no code");
        if (d.proxy.code.length == 0) return _summary();
        _eq(
            "proxy code is OpenZeppelin ERC1967Proxy",
            keccak256(d.proxy.code),
            keccak256(type(ERC1967Proxy).runtimeCode)
        );
        GLDT token = GLDT(d.proxy);
        address impl = address(uint160(uint256(vm.load(d.proxy, ERC1967_IMPLEMENTATION_SLOT))));
        _eq("implementation is the deployment file's", impl, d.implementation);
        _eq("implementation code hash is the deployment file's", impl.codehash, d.implementationCodeHash);
        _eq("token endpoint is the config's", address(token.endpoint()), c.endpoint);
        _eq("endpoint eid is the config's", uint256(ILayerZeroEndpointV2(c.endpoint).eid()), uint256(c.eid));

        _checkState(c, token);
        _checkInitializers(c, token, impl);
        _checkDomain(c, token);
        _checkLayerZero(c, token, expectedPeer);
        // Last, because it replaces the implementation's code for a moment (and puts it back).
        _checkFreshBuild(c, impl);
        return _summary();
    }

    // Spec 7.3: supply, burns, pause, owner, delegate, signers, operator, minimum.
    function _checkState(GLDTConfig memory c, GLDT token) private {
        _eq("totalSupply is 0", token.totalSupply(), 0);
        _eq("nextBurnId is 0", uint256(token.nextBurnId()), 0);
        (bool lzPaused, bool icpBridgePaused) = token.paused();
        _ok("nothing is paused", !lzPaused && !icpBridgePaused, _pausedText(lzPaused, icpBridgePaused));
        _eq("owner is the token itself", token.owner(), address(token));
        _eq(
            "LayerZero delegate is the token itself",
            IEndpointDelegates(c.endpoint).delegates(address(token)),
            address(token)
        );
        _eq("adminSigner is the config's (spec 7.1)", token.adminSigner(), c.adminSigner);
        _eq("icpSigner is the config's (spec 7.1)", token.icpSigner(), c.icpSigner);
        _eq("operator is the config's", token.operator(), c.operator);
        _eq("minBurnToIcp is 1 GLDT", token.minBurnToIcp(), MIN_BURN_TO_ICP);
        _eq("decimals is 8", uint256(token.decimals()), 8);
        _eq("sharedDecimals is 8", uint256(token.sharedDecimals()), 8);
        _eqStr("name is the config's", token.name(), c.name);
        _eqStr("symbol is the config's", token.symbol(), c.symbol);
    }

    // Spec 7.3: the implementation's initializer can't be called, and neither can the proxy's again.
    function _checkInitializers(GLDTConfig memory c, GLDT token, address impl) private {
        uint256 raw = uint256(vm.load(impl, INITIALIZABLE_SLOT));
        _ok(
            "implementation initializers are disabled",
            uint64(raw) == type(uint64).max && (raw >> 64) & 1 == 0,
            vm.toString(bytes32(raw))
        );
        IGLDT.InitParams memory p = _initParams(c, address(token));
        _reverts("implementation initialize reverts InvalidInitialization", impl, abi.encodeCall(GLDT.initialize, (p)));
        _reverts(
            "proxy initialize reverts InvalidInitialization",
            address(token),
            abi.encodeCall(GLDT.initialize, (p))
        );
    }

    // Spec 7.3: eip712Domain() is ("Gold Token", "1", chain id, proxy), the domain gldt_swap signs with.
    function _checkDomain(GLDTConfig memory c, GLDT token) private {
        (
            bytes1 fields,
            string memory name,
            string memory version,
            uint256 chainId,
            address verifyingContract,
            bytes32 salt,
            uint256[] memory extensions
        ) = token.eip712Domain();
        _eq("eip712Domain fields are 0x0f", uint256(uint8(fields)), 0x0f);
        _eqStr("eip712Domain name is Gold Token", name, TOKEN_NAME);
        _eqStr("eip712Domain version is 1", version, "1");
        _eq("eip712Domain chainId is the config's", chainId, c.chainId);
        _eq("eip712Domain verifyingContract is the proxy", verifyingContract, address(token));
        _ok(
            "eip712Domain has no salt and no extensions",
            salt == 0 && extensions.length == 0,
            "salt or extensions set"
        );
        bytes32 expected = keccak256(
            abi.encode(EIP712_DOMAIN_TYPEHASH, keccak256(bytes(TOKEN_NAME)), keccak256("1"), c.chainId, address(token))
        );
        _eq("DOMAIN_SEPARATOR matches the domain", token.DOMAIN_SEPARATOR(), expected);
    }

    // Spec 7.3: peers, libraries, DVNs, executor, enforced options; nothing from LayerZero's defaults.
    function _checkLayerZero(GLDTConfig memory c, GLDT token, address expectedPeer) private {
        ILayerZeroEndpointV2 endpoint = ILayerZeroEndpointV2(c.endpoint);
        address oapp = address(token);
        _eq(
            string.concat("peer for eid ", vm.toString(uint256(c.peerEid)), " is the other chain's token"),
            token.peers(c.peerEid),
            bytes32(uint256(uint160(expectedPeer)))
        );

        _ok("send library is registered", endpoint.isRegisteredLibrary(c.sendLib), vm.toString(c.sendLib));
        _ok("receive library is registered", endpoint.isRegisteredLibrary(c.receiveLib), vm.toString(c.receiveLib));
        _eq("send library is the config's", endpoint.getSendLibrary(oapp, c.peerEid), c.sendLib);
        _ok("send library is set, not the default", !endpoint.isDefaultSendLibrary(oapp, c.peerEid), "default");
        (address receiveLib, bool receiveIsDefault) = endpoint.getReceiveLibrary(oapp, c.peerEid);
        _eq("receive library is the config's", receiveLib, c.receiveLib);
        _ok("receive library is set, not the default", !receiveIsDefault, "default");
        (address graceLib, uint256 graceExpiry) = endpoint.receiveLibraryTimeout(oapp, c.peerEid);
        _ok("no receive library grace period", graceLib == address(0) && graceExpiry == 0, vm.toString(graceLib));

        bytes memory wantExecutor = abi.encode(ExecutorConfig(c.maxMessageSize, c.executor));
        (uint32 storedSize, address storedExecutor) = IExecutorConfigReader(c.sendLib).executorConfigs(oapp, c.peerEid);
        _eqBytes("executor config stored as set", abi.encode(ExecutorConfig(storedSize, storedExecutor)), wantExecutor);
        _eqBytes(
            "executor config in effect is the config's",
            endpoint.getConfig(oapp, c.sendLib, c.peerEid, CONFIG_TYPE_EXECUTOR),
            wantExecutor
        );

        _eqUln(
            "send ULN config stored as set",
            IUlnConfigReader(c.sendLib).getAppUlnConfig(oapp, c.peerEid),
            _uln(c.sendConfirmations, c.sendDVNs)
        );
        _eqUln(
            "send ULN config in effect is the config's",
            abi.decode(endpoint.getConfig(oapp, c.sendLib, c.peerEid, CONFIG_TYPE_ULN), (UlnConfig)),
            _ulnInEffect(c.sendConfirmations, c.sendDVNs)
        );
        _eqUln(
            "receive ULN config stored as set",
            IUlnConfigReader(c.receiveLib).getAppUlnConfig(oapp, c.peerEid),
            _uln(c.receiveConfirmations, c.receiveDVNs)
        );
        _eqUln(
            "receive ULN config in effect is the config's",
            abi.decode(endpoint.getConfig(oapp, c.receiveLib, c.peerEid, CONFIG_TYPE_ULN), (UlnConfig)),
            _ulnInEffect(c.receiveConfirmations, c.receiveDVNs)
        );
        _ok("DVN lists are sorted ascending", _sortedDvns(c.sendDVNs) && _sortedDvns(c.receiveDVNs), "not sorted");
        _hasCode("executor", c.executor);
        for (uint256 i = 0; i < c.sendDVNs.length; i++) _hasCode("send DVN", c.sendDVNs[i]);
        for (uint256 i = 0; i < c.receiveDVNs.length; i++) _hasCode("receive DVN", c.receiveDVNs[i]);

        // Type 3 options, one lzReceive option of 16 bytes of gas and no value (spec 6.5).
        _eqBytes(
            string.concat("enforced options: lzReceive gas ", vm.toString(uint256(c.lzReceiveGas)), ", value 0"),
            token.enforcedOptions(c.peerEid, SEND),
            abi.encodePacked(uint16(3), uint8(1), uint16(17), uint8(1), c.lzReceiveGas)
        );
        // The quote asks the executor and every DVN for a fee, so it fails if one of them does not serve the path.
        SendParam memory sp = SendParam(c.peerEid, bytes32(uint256(uint160(oapp))), 1e8, 1e8, "", "", "");
        try token.quoteSend(sp, false) returns (MessagingFee memory fee) {
            _ok("quoteSend to the peer works", fee.nativeFee > 0, "zero fee");
        } catch (bytes memory reason) {
            _ok("quoteSend to the peer works", false, vm.toString(reason));
        }
    }

    /// @dev Our build of src/GLDT.sol, constructed with the config's endpoint at the implementation's own address,
    /// must give exactly the deployed code. The address matters: UUPSUpgradeable keeps it in an immutable.
    function _checkFreshBuild(GLDTConfig memory c, address impl) private {
        bytes memory deployed = impl.code;
        vm.etch(impl, abi.encodePacked(type(GLDT).creationCode, abi.encode(c.endpoint)));
        (bool built, bytes memory fresh) = impl.call("");
        vm.etch(impl, deployed);
        _ok(
            "implementation code hash matches a fresh build of src/GLDT.sol",
            built && keccak256(fresh) == keccak256(deployed),
            string.concat("deployed ", vm.toString(keccak256(deployed)), ", fresh ", vm.toString(keccak256(fresh)))
        );
    }

    /// @dev What UlnBase.getUlnConfig returns for our stored config: the NIL optional count reads back as 0.
    function _ulnInEffect(uint64 confirmations, address[] memory dvns) private pure returns (UlnConfig memory u) {
        u = _uln(confirmations, dvns);
        u.optionalDVNCount = 0;
    }

    // Reporting

    function _summary() private view returns (uint256) {
        console2.log(string.concat(vm.toString(_passed), " passed, ", vm.toString(_failed), " failed"));
        return _failed;
    }

    function _ok(string memory item, bool ok, string memory detail) private {
        if (ok) {
            _passed++;
            console2.log(string.concat("PASS  ", item));
        } else {
            _failed++;
            console2.log(string.concat("FAIL  ", item, ": ", detail));
        }
    }

    function _eq(string memory item, uint256 got, uint256 want) private {
        _ok(item, got == want, string.concat("got ", vm.toString(got), ", want ", vm.toString(want)));
    }

    function _eq(string memory item, address got, address want) private {
        _ok(item, got == want, string.concat("got ", vm.toString(got), ", want ", vm.toString(want)));
    }

    function _eq(string memory item, bytes32 got, bytes32 want) private {
        _ok(item, got == want, string.concat("got ", vm.toString(got), ", want ", vm.toString(want)));
    }

    function _eqStr(string memory item, string memory got, string memory want) private {
        _ok(item, keccak256(bytes(got)) == keccak256(bytes(want)), string.concat("got ", got, ", want ", want));
    }

    function _eqBytes(string memory item, bytes memory got, bytes memory want) private {
        _ok(
            item,
            keccak256(got) == keccak256(want),
            string.concat("got ", vm.toString(got), ", want ", vm.toString(want))
        );
    }

    function _eqUln(string memory item, UlnConfig memory got, UlnConfig memory want) private {
        _ok(
            item,
            keccak256(abi.encode(got)) == keccak256(abi.encode(want)),
            string.concat("got ", _ulnText(got), "; want ", _ulnText(want))
        );
    }

    function _ulnText(UlnConfig memory u) private pure returns (string memory t) {
        t = string.concat(
            "confirmations ",
            vm.toString(uint256(u.confirmations)),
            ", required ",
            vm.toString(uint256(u.requiredDVNCount)),
            " [",
            _addressList(u.requiredDVNs),
            "], optional ",
            vm.toString(uint256(u.optionalDVNCount))
        );
        t = string.concat(
            t,
            " [",
            _addressList(u.optionalDVNs),
            "], threshold ",
            vm.toString(uint256(u.optionalDVNThreshold))
        );
    }

    function _addressList(address[] memory list) private pure returns (string memory t) {
        for (uint256 i = 0; i < list.length; i++) {
            t = string.concat(t, i == 0 ? "" : " ", vm.toString(list[i]));
        }
    }

    function _hasCode(string memory what, address a) private {
        _ok(string.concat(what, " ", vm.toString(a), " has code"), a.code.length > 0, "no code");
    }

    function _reverts(string memory item, address target, bytes memory data) private {
        (bool success, bytes memory reason) = target.call(data);
        bool expected = !success &&
            reason.length == 4 &&
            bytes4(reason) == Initializable.InvalidInitialization.selector;
        _ok(item, expected, success ? "the call succeeded" : vm.toString(reason));
    }

    function _pausedText(bool lzPaused, bool icpBridgePaused) private pure returns (string memory) {
        return
            string.concat(
                "lzPaused ",
                lzPaused ? "true" : "false",
                ", icpBridgePaused ",
                icpBridgePaused ? "true" : "false"
            );
    }
}
