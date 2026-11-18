//! The only conversions between EVM `uint256` values and Candid `nat`.
//!
//! Candid has no 256-bit type, so the API shows EVM amounts as `nat`.

use alloy_primitives::U256;
use candid::Nat;
use num_bigint::BigUint;

/// Lossless: every `U256` fits in a `nat`.
pub fn u256_to_nat(v: U256) -> Nat {
    Nat(BigUint::from_bytes_be(&v.to_be_bytes::<32>()))
}

/// `None` above `2^256 - 1`. Callers reject the value; this never panics.
pub fn nat_to_u256(n: &Nat) -> Option<U256> {
    U256::try_from_be_slice(&n.0.to_bytes_be())
}

#[cfg(test)]
mod tests {
    use super::*;

    const U256_MAX_DEC: &str =
        "115792089237316195423570985008687907853269984665640564039457584007913129639935";
    const TWO_POW_256_DEC: &str =
        "115792089237316195423570985008687907853269984665640564039457584007913129639936";
    const TWO_POW_128_DEC: &str = "340282366920938463463374607431768211456";

    #[test]
    fn nat_to_u256_rejects_above_max_and_u256_to_nat_is_lossless() {
        let max: Nat = U256_MAX_DEC.parse().unwrap();
        assert_eq!(u256_to_nat(U256::MAX), max);
        assert_eq!(nat_to_u256(&max), Some(U256::MAX));

        let above: Nat = TWO_POW_256_DEC.parse().unwrap();
        assert_eq!(nat_to_u256(&above), None);
        let far_above: Nat = format!("{TWO_POW_256_DEC}000").parse().unwrap();
        assert_eq!(nat_to_u256(&far_above), None);

        assert_eq!(u256_to_nat(U256::ZERO), Nat::from(0u8));
        assert_eq!(nat_to_u256(&Nat::from(0u8)), Some(U256::ZERO));

        let two_pow_128: U256 = TWO_POW_128_DEC.parse().unwrap();
        let nat = u256_to_nat(two_pow_128);
        assert_eq!(nat, TWO_POW_128_DEC.parse::<Nat>().unwrap());
        assert_eq!(nat_to_u256(&nat), Some(two_pow_128));

        let e8s = Nat::from(100_000_000u64);
        assert_eq!(nat_to_u256(&e8s), Some(U256::from(100_000_000u64)));
        assert_eq!(u256_to_nat(U256::from(u128::MAX)), Nat::from(u128::MAX));
    }
}
