// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.28;

import { GLDT } from "../../src/GLDT.sol";

// No initializer of its own: it only replaces the code behind a proxy that GLDT.initialize already set up.
/// @notice A next implementation for the upgrade tests: GLDT plus a version number, nothing else.
/// @custom:oz-upgrades-unsafe-allow missing-initializer
contract GLDTV2Mock is GLDT {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(address lzEndpoint) GLDT(lzEndpoint) {}

    function version() external pure returns (uint256) {
        return 2;
    }
}
