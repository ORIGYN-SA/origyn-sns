// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.28;

import { Script } from "forge-std/Script.sol";

import { GLDTConfig, GLDTDeployment } from "./lib/GLDTConfig.sol";
import { GLDTCheckCore } from "./lib/GLDTCheckCore.sol";

/// @notice Checks a deployed GLDT against its config, one PASS or FAIL line per item, and exits non-zero
/// if any item fails. Read only: it never broadcasts. Run it on both chains; the peer must be the same proxy
/// address on each, so together the two runs prove the peers point both ways.
///
///   forge script script/Check.s.sol --sig 'run(string)' ethereum --rpc-url <url>
contract Check is Script, GLDTCheckCore {
    function run(string calldata chain) external {
        run(string.concat("script/config/", chain, ".json"), string.concat("deployments/", chain, ".json"));
    }

    function run(string memory configPath, string memory deploymentPath) public {
        GLDTConfig memory c = _loadConfig(configPath);
        GLDTDeployment memory d = _loadDeployment(deploymentPath);
        uint256 failed = _checkGLDT(c, d, d.proxy);
        if (failed > 0) revert(string.concat(vm.toString(failed), " check(s) failed"));
    }
}
