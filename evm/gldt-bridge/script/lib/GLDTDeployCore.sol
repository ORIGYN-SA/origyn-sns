// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.28;

import { ERC1967Proxy } from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import { GLDT } from "../../src/GLDT.sol";
import { GLDTConfig, GLDTDeployment, GLDTConfigReader, ICreateX } from "./GLDTConfig.sol";

/// @notice The implementation, then the proxy through CreateX CREATE3 with the salt.
/// Deploy.s.sol runs this under broadcast; the fork test runs it under a prank of the operator wallet.
abstract contract GLDTDeployCore is GLDTConfigReader {
    /// @notice CreateX's guard for a salt that starts with the caller and has byte 21 = 0x00: permissioned, with no
    /// chain id mixed in, so the same wallet and salt give the same address on every chain.
    function _guardedSalt(address deployer, bytes32 salt) internal pure returns (bytes32) {
        return keccak256(abi.encode(deployer, salt));
    }

    /// @notice The proxy address `deployer` gets with `salt`, before anything is deployed.
    function _predictProxy(address deployer, bytes32 salt) internal view returns (address) {
        return ICreateX(CREATEX).computeCreate3Address(_guardedSalt(deployer, salt));
    }

    /// @notice Reverts unless the config is complete and `deployer` is the wallet the salt names.
    function _validateForDeploy(GLDTConfig memory c, address deployer) internal view {
        require(c.operator != address(0), "config: operator is not set");
        require(deployer == c.operator, "deployer: the operator wallet deploys");
        require(c.salt != bytes32(0), "config: salt is not set");
        require(address(bytes20(c.salt)) == deployer, "config: the salt must start with the deployer address");
        require(c.salt[20] == 0x00, "config: byte 21 of the salt must be 0x00 (no cross-chain redeploy protection)");
        require(c.adminSigner != address(0) && c.icpSigner != address(0), "config: a signer is not set");
        require(c.sendLib != address(0) && c.receiveLib != address(0), "config: a library is not set");
        require(c.executor != address(0) && c.maxMessageSize > 0, "config: executor or maxMessageSize is not set");
        require(c.sendConfirmations > 0 && c.receiveConfirmations > 0, "config: confirmations are not set");
        require(_sortedDvns(c.sendDVNs) && _sortedDvns(c.receiveDVNs), "config: DVNs must be set and sorted ascending");
        require(c.sendDVNs.length >= 2 && c.receiveDVNs.length >= 2, "config: two required DVNs");
        require(c.eid != 0 && c.peerEid != 0 && c.eid != c.peerEid, "config: eid and peerEid");
        require(keccak256(bytes(c.name)) == keccak256(bytes(TOKEN_NAME)), "config: name must be Gold Token");
        require(keccak256(bytes(c.symbol)) == keccak256(bytes(TOKEN_SYMBOL)), "config: symbol must be GLDT");
        require(c.endpoint.code.length > 0, "chain: no code at the endpoint");
        require(CREATEX.code.length > 0, "chain: no CreateX");
    }

    /// @notice Deploys the implementation and the proxy, initialized in the same transaction, so the deployer never
    /// holds any power over the token. Every external call here is made by `deployer`.
    function _deployGLDT(GLDTConfig memory c, address deployer) internal returns (GLDTDeployment memory d) {
        _validateForDeploy(c, deployer);
        address predicted = _predictProxy(deployer, c.salt);
        require(predicted.code.length == 0, "the proxy address is taken; pick a new salt");

        GLDT impl = new GLDT(c.endpoint);
        // One address on both chains, so the peer is this same proxy address.
        bytes memory initCode = abi.encodePacked(
            type(ERC1967Proxy).creationCode,
            abi.encode(address(impl), abi.encodeCall(GLDT.initialize, (_initParams(c, predicted))))
        );
        address proxy = ICreateX(CREATEX).deployCreate3(c.salt, initCode);
        require(proxy == predicted, "the proxy address differs from the prediction");

        d = GLDTDeployment({
            chainId: c.chainId,
            proxy: proxy,
            implementation: address(impl),
            implementationCodeHash: address(impl).codehash,
            blockNumber: block.number
        });
    }
}
