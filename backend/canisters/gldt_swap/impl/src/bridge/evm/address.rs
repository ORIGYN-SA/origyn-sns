//! EVM addresses: derivation from a secp256k1 public key, EIP-55 text, and parsing.

use alloy_primitives::{keccak256, Address};
use k256::elliptic_curve::sec1::ToEncodedPoint;

/// The Ethereum address of a SEC1 public key (compressed or uncompressed):
/// the last 20 bytes of the keccak of the uncompressed key without its 0x04 tag.
///
/// Panics on bytes that are not a valid secp256k1 public key. Use
/// [`try_evm_address`] for keys that are not known to be valid.
pub fn evm_address(sec1: &[u8]) -> [u8; 20] {
    try_evm_address(sec1).expect("invalid secp256k1 public key")
}

pub fn try_evm_address(sec1: &[u8]) -> Result<[u8; 20], String> {
    let key = k256::PublicKey::from_sec1_bytes(sec1)
        .map_err(|_| "invalid secp256k1 public key".to_string())?;
    let point = key.to_encoded_point(false);
    let hash = keccak256(&point.as_bytes()[1..]);
    let mut address = [0u8; 20];
    address.copy_from_slice(&hash[12..]);
    Ok(address)
}

/// EIP-55 checksummed `0x` text.
pub fn format_address(address: &[u8; 20]) -> String {
    Address::from(*address).to_checksum(None)
}

/// Parses `0x` and 40 hex digits. All lower case and all upper case are accepted;
/// mixed case must be a valid EIP-55 checksum, which catches typos.
pub fn parse_address(text: &str) -> Result<[u8; 20], String> {
    let digits = text
        .strip_prefix("0x")
        .ok_or_else(|| format!("{text:?} does not start with 0x"))?;
    if digits.len() != 40 || !digits.bytes().all(|b| b.is_ascii_hexdigit()) {
        return Err(format!("{text:?} is not 0x and 40 hex digits"));
    }
    let mut address = [0u8; 20];
    alloy_primitives::hex::decode_to_slice(digits, &mut address)
        .map_err(|e| format!("{text:?} is not hex: {e}"))?;
    let has_upper = digits.bytes().any(|b| b.is_ascii_uppercase());
    let has_lower = digits.bytes().any(|b| b.is_ascii_lowercase());
    if has_upper && has_lower && format_address(&address) != text {
        return Err(format!("{text:?} has a bad EIP-55 checksum"));
    }
    Ok(address)
}

#[cfg(test)]
mod tests {
    use super::*;

    const CLAIMS_SEC1: &str = "03d78882d15e536daea44eb18cf3c2530d4171f7c356f7e6c1d1b61cf3e1e572e6";
    const CLAIMS_ADDRESS: &str = "0x0A82D20142d067C8AF32f48664bDDfb65EcAE507";

    #[test]
    fn evm_address_matches_known_vector() {
        let sec1 = alloy_primitives::hex::decode(CLAIMS_SEC1).unwrap();
        let address = evm_address(&sec1);
        assert_eq!(format_address(&address), CLAIMS_ADDRESS);
    }

    #[test]
    fn uncompressed_key_gives_the_same_address() {
        let sec1 = alloy_primitives::hex::decode(CLAIMS_SEC1).unwrap();
        let key = k256::PublicKey::from_sec1_bytes(&sec1).unwrap();
        let uncompressed =
            k256::elliptic_curve::sec1::ToEncodedPoint::to_encoded_point(&key, false);
        assert_eq!(uncompressed.as_bytes().len(), 65);
        assert_eq!(evm_address(uncompressed.as_bytes()), evm_address(&sec1));
    }

    #[test]
    fn invalid_public_key_is_an_error() {
        assert!(try_evm_address(&[]).is_err());
        // 0x05 is not a SEC1 tag
        assert!(try_evm_address(&[5; 33]).is_err());
    }

    #[test]
    fn parse_address_checks_length_prefix_and_checksum() {
        assert_eq!(
            format_address(&parse_address(CLAIMS_ADDRESS).unwrap()),
            CLAIMS_ADDRESS
        );
        assert!(parse_address(&CLAIMS_ADDRESS.to_lowercase()).is_ok());
        assert!(parse_address(&format!("0x{}", CLAIMS_ADDRESS[2..].to_uppercase())).is_ok());
        assert!(parse_address("0x1a44076050125825900e736c501f859c50fE728c").is_ok());
        assert!(parse_address("0x0a82D20142d067C8AF32f48664bDDfb65EcAE507").is_err());
        assert!(parse_address(&CLAIMS_ADDRESS[2..]).is_err());
        assert!(parse_address("0x0A82D20142d067C8AF32f48664bDDfb65EcAE5").is_err());
        assert!(parse_address("0x0A82D20142d067C8AF32f48664bDDfb65EcAE50700").is_err());
        assert!(parse_address("0xgA82D20142d067C8AF32f48664bDDfb65EcAE507").is_err());
    }
}
