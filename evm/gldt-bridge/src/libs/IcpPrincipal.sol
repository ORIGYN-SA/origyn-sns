// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.28;

/// @title ICP principal in one bytes32
/// @notice Byte 0 is the principal's length (1 to 29), then that many principal bytes, then zeros.
/// This is the encoding DFINITY's ckETH helper contract uses.
library IcpPrincipal {
    uint256 internal constant MAX_LENGTH = 29;

    function isValid(bytes32 p) internal pure returns (bool) {
        uint256 len = uint8(p[0]);
        if (len == 0 || len > MAX_LENGTH) return false;
        // Drop the length byte and the principal bytes; whatever is left must be zero.
        return uint256(p) << (8 * (1 + len)) == 0;
    }
}
