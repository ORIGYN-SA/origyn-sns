// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.28;

import { ERC1967Proxy } from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import { EndpointV2Mock } from "@layerzerolabs/test-devtools-evm-foundry/contracts/mocks/EndpointV2Mock.sol";
import { SendUln302Mock } from "@layerzerolabs/test-devtools-evm-foundry/contracts/mocks/SendUln302Mock.sol";
import { ReceiveUln302Mock } from "@layerzerolabs/test-devtools-evm-foundry/contracts/mocks/ReceiveUln302Mock.sol";
import { DVNMock, IDVN } from "@layerzerolabs/test-devtools-evm-foundry/contracts/mocks/DVNMock.sol";
import { DVNFeeLibMock } from "@layerzerolabs/test-devtools-evm-foundry/contracts/mocks/DVNFeeLibMock.sol";
import { ExecutorMock, IExecutor } from "@layerzerolabs/test-devtools-evm-foundry/contracts/mocks/ExecutorMock.sol";
import { ExecutorFeeLibMock } from "@layerzerolabs/test-devtools-evm-foundry/contracts/mocks/ExecutorFeeLibMock.sol";
import { PriceFeedMock, ILayerZeroPriceFeed } from "@layerzerolabs/test-devtools-evm-foundry/contracts/mocks/PriceFeedMock.sol";
import { UlnConfig, SetDefaultUlnConfigParam } from "@layerzerolabs/lz-evm-messagelib-v2/contracts/uln/UlnBase.sol";
import { ExecutorConfig, SetDefaultExecutorConfigParam } from "@layerzerolabs/lz-evm-messagelib-v2/contracts/SendLibBase.sol";

import { GLDT } from "../../src/GLDT.sol";
import { GLDTConfig, GLDTConfigReader } from "./GLDTConfig.sol";

/// @dev SendUln302Mock hands every sent packet to a TestHelperOz5. On anvil there is none, so this takes them.
contract LocalPacketSink {
    function schedulePacket(bytes calldata, bytes calldata) external {}
}

/// @notice One local chain: a LayerZero test endpoint with ULN302, an executor and two DVNs, and one GLDT.
struct LocalChain {
    uint32 eid;
    address endpoint;
    address sendLib;
    address receiveLib;
    address executor;
    address[] dvns;
    address implementation;
    address token;
}

/// @notice The LayerZero test stack (like TestHelperOz5, but owned by the deployer, so it works under broadcast)
/// and two GLDT tokens wired to each other with every LayerZero field explicit, as on mainnet.
abstract contract DeployLocalCore is GLDTConfigReader {
    uint32 internal constant LOCAL_EID_A = 1;
    uint32 internal constant LOCAL_EID_B = 2;
    uint64 internal constant LOCAL_CONFIRMATIONS = 1;
    uint32 internal constant LOCAL_MAX_MESSAGE_SIZE = 10_000;
    uint128 internal constant LOCAL_LZ_RECEIVE_GAS = 100_000;

    /// @dev Every call is made by `deployer`, which owns every mock.
    function _deployLocal(
        address deployer,
        address operator,
        address adminSigner,
        address icpSigner
    ) internal returns (LocalChain memory a, LocalChain memory b) {
        PriceFeedMock priceFeed = new PriceFeedMock(deployer);
        address sink = address(new LocalPacketSink());
        a = _deployLayerZero(LOCAL_EID_A, LOCAL_EID_B, deployer, priceFeed, sink);
        b = _deployLayerZero(LOCAL_EID_B, LOCAL_EID_A, deployer, priceFeed, sink);

        // Plain CREATE: predict both proxies first, so each initializer names the other as its peer.
        uint64 nonce = vm.getNonce(deployer);
        address proxyA = vm.computeCreateAddress(deployer, nonce + 2);
        address proxyB = vm.computeCreateAddress(deployer, nonce + 3);
        a.implementation = address(new GLDT(a.endpoint));
        b.implementation = address(new GLDT(b.endpoint));
        a.token = _deployToken(a, LOCAL_EID_B, operator, adminSigner, icpSigner, proxyB);
        b.token = _deployToken(b, LOCAL_EID_A, operator, adminSigner, icpSigner, proxyA);
        require(a.token == proxyA && b.token == proxyB, "token addresses differ from the prediction");
    }

    /// @notice The config Check and the tests use for a local token.
    function _localConfig(
        LocalChain memory chain,
        uint32 peerEid,
        address operator,
        address adminSigner,
        address icpSigner
    ) internal view returns (GLDTConfig memory c) {
        c.chain = string.concat("local eid ", vm.toString(uint256(chain.eid)));
        c.chainId = block.chainid;
        c.eid = chain.eid;
        c.endpoint = chain.endpoint;
        c.peerEid = peerEid;
        c.sendLib = chain.sendLib;
        c.receiveLib = chain.receiveLib;
        c.executor = chain.executor;
        c.maxMessageSize = LOCAL_MAX_MESSAGE_SIZE;
        c.sendConfirmations = LOCAL_CONFIRMATIONS;
        c.sendDVNs = chain.dvns;
        c.receiveConfirmations = LOCAL_CONFIRMATIONS;
        c.receiveDVNs = chain.dvns;
        c.lzReceiveGas = LOCAL_LZ_RECEIVE_GAS;
        c.operator = operator;
        c.adminSigner = adminSigner;
        c.icpSigner = icpSigner;
        c.name = TOKEN_NAME;
        c.symbol = TOKEN_SYMBOL;
    }

    function _deployToken(
        LocalChain memory chain,
        uint32 peerEid,
        address operator,
        address adminSigner,
        address icpSigner,
        address peer
    ) private returns (address) {
        GLDTConfig memory c = _localConfig(chain, peerEid, operator, adminSigner, icpSigner);
        bytes memory init = abi.encodeCall(GLDT.initialize, (_initParams(c, peer)));
        return address(new ERC1967Proxy(chain.implementation, init));
    }

    function _deployLayerZero(
        uint32 eid,
        uint32 remoteEid,
        address deployer,
        PriceFeedMock priceFeed,
        address sink
    ) private returns (LocalChain memory chain) {
        chain.eid = eid;
        EndpointV2Mock endpoint = new EndpointV2Mock(eid, deployer);
        SendUln302Mock sendLib = new SendUln302Mock(payable(sink), address(endpoint), 1e12, 100_000);
        ReceiveUln302Mock receiveLib = new ReceiveUln302Mock(address(endpoint));
        endpoint.registerLibrary(address(sendLib));
        endpoint.registerLibrary(address(receiveLib));
        chain.endpoint = address(endpoint);
        chain.sendLib = address(sendLib);
        chain.receiveLib = address(receiveLib);

        address[] memory libs = new address[](2);
        libs[0] = address(sendLib);
        libs[1] = address(receiveLib);
        address[] memory admins = new address[](1);
        admins[0] = deployer;

        ExecutorMock executor = new ExecutorMock(
            address(endpoint),
            address(0),
            libs,
            address(priceFeed),
            deployer,
            admins
        );
        executor.setWorkerFeeLib(address(new ExecutorFeeLibMock(eid)));
        IExecutor.DstConfigParam[] memory executorDst = new IExecutor.DstConfigParam[](1);
        executorDst[0] = IExecutor.DstConfigParam({
            dstEid: remoteEid,
            lzReceiveBaseGas: 5_000,
            lzComposeBaseGas: 5_000,
            multiplierBps: 10_000,
            floorMarginUSD: 1e10,
            nativeCap: 0.1 ether
        });
        executor.setDstConfig(executorDst);
        chain.executor = address(executor);

        chain.dvns = new address[](2);
        chain.dvns[0] = _deployDvn(eid, remoteEid, eid * 10 + 1, libs, admins, address(priceFeed));
        chain.dvns[1] = _deployDvn(eid, remoteEid, eid * 10 + 2, libs, admins, address(priceFeed));
        if (chain.dvns[0] > chain.dvns[1]) (chain.dvns[0], chain.dvns[1]) = (chain.dvns[1], chain.dvns[0]);

        // Defaults, so the libraries support remoteEid; the tokens then set every field themselves.
        address[] memory defaultDvns = new address[](1);
        defaultDvns[0] = chain.dvns[0];
        SetDefaultUlnConfigParam[] memory uln = new SetDefaultUlnConfigParam[](1);
        uln[0] = SetDefaultUlnConfigParam(
            remoteEid,
            UlnConfig(LOCAL_CONFIRMATIONS, 1, 0, 0, defaultDvns, new address[](0))
        );
        sendLib.setDefaultUlnConfigs(uln);
        receiveLib.setDefaultUlnConfigs(uln);
        SetDefaultExecutorConfigParam[] memory exec = new SetDefaultExecutorConfigParam[](1);
        exec[0] = SetDefaultExecutorConfigParam(remoteEid, ExecutorConfig(LOCAL_MAX_MESSAGE_SIZE, address(executor)));
        sendLib.setDefaultExecutorConfigs(exec);

        ILayerZeroPriceFeed.UpdatePrice[] memory prices = new ILayerZeroPriceFeed.UpdatePrice[](1);
        prices[0] = ILayerZeroPriceFeed.UpdatePrice(
            remoteEid,
            ILayerZeroPriceFeed.Price(priceFeed.getPriceRatioDenominator(), 1, 1)
        );
        priceFeed.setPrice(prices);
        priceFeed.setNativeTokenPriceUSD(1e20);
    }

    function _deployDvn(
        uint32 eid,
        uint32 remoteEid,
        uint32 vid,
        address[] memory libs,
        address[] memory admins,
        address priceFeed
    ) private returns (address) {
        DVNMock dvn = new DVNMock(eid, vid, libs, priceFeed, admins, 1, admins);
        dvn.setWorkerFeeLib(address(new DVNFeeLibMock(eid, 1e18)));
        IDVN.DstConfigParam[] memory dst = new IDVN.DstConfigParam[](1);
        dst[0] = IDVN.DstConfigParam({ dstEid: remoteEid, gas: 5_000, multiplierBps: 10_000, floorMarginUSD: 1e10 });
        dvn.setDstConfig(dst);
        return address(dvn);
    }
}
