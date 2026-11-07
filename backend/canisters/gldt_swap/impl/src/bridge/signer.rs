//! The canister's two threshold ECDSA keys, their Ethereum addresses, and signing.
//!
//! The derivation paths are code constants, never config, so an upgrade argument
//! can't move the signer addresses. Mainnet `key_1` gives claims
//! `0x0A82D20142d067C8AF32f48664bDDfb65EcAE507` and admin
//! `0x216C1E5F2b9EB767Cec5C7d4DFa2d02b5A0AA143`.
//!
//! Both keys sign only Claim and Execute digests the canister builds itself (spec 8.13).

pub use crate::bridge::evm::address::evm_address;
use crate::bridge::evm::address::{format_address, try_evm_address};
use crate::bridge::state::{BridgeState, EvmSigner};
use crate::state::{mutate_state, read_state};
use ic_cdk_management_canister::{EcdsaCurve, EcdsaKeyId, EcdsaPublicKeyArgs, SignWithEcdsaArgs};
use k256::ecdsa::{RecoveryId, Signature, VerifyingKey};
use std::time::Duration;
use tracing::{info, warn};

/// Signs claim vouchers; set as `icpSigner` on both tokens.
pub const CLAIMS_PATH: &[&[u8]] = &[b"gldt-bridge-claims-v1"];
/// Signs `execute` batches; set as `adminSigner` on both tokens.
pub const ADMIN_PATH: &[&[u8]] = &[b"gldt-bridge-admin-v1"];

pub const LOAD_SIGNERS_RETRY: Duration = Duration::from_secs(30);

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum SignerPath {
    Claims,
    Admin,
}

impl SignerPath {
    pub fn path(self) -> &'static [&'static [u8]] {
        match self {
            SignerPath::Claims => CLAIMS_PATH,
            SignerPath::Admin => ADMIN_PATH,
        }
    }

    pub fn derivation_path(self) -> Vec<Vec<u8>> {
        self.path().iter().map(|part| part.to_vec()).collect()
    }

    pub fn key_id(key_name: &str) -> EcdsaKeyId {
        EcdsaKeyId {
            curve: EcdsaCurve::Secp256k1,
            name: key_name.to_string(),
        }
    }
}

/// The loaded signer for a path, if any.
pub fn signer(path: SignerPath) -> Option<EvmSigner> {
    read_state(|s| match path {
        SignerPath::Claims => s.data.bridge.claims_signer.clone(),
        SignerPath::Admin => s.data.bridge.admin_signer.clone(),
    })
}

/// Fetches both public keys with `config.ecdsa_key_name` and stores them, then
/// retries every 30 s until both are loaded. Does nothing while the bridge has no config.
/// Runs after init and every upgrade, so the stored keys always come from the current key.
/// Once both are loaded, chains without a start block run their first tick.
pub async fn load_signers() {
    let Some(key_name) = read_state(|s| {
        s.data
            .bridge
            .config
            .as_ref()
            .map(|c| c.ecdsa_key_name.clone())
    }) else {
        return;
    };

    let mut all_loaded = true;
    for path in [SignerPath::Claims, SignerPath::Admin] {
        match fetch_signer(path, &key_name).await {
            Ok(signer) => {
                info!(?path, address = %format_address(&signer.address), "bridge signer loaded");
                mutate_state(|s| {
                    // the config may have changed key while we waited; keep only a matching answer
                    let current = s
                        .data
                        .bridge
                        .config
                        .as_ref()
                        .map(|c| c.ecdsa_key_name.as_str());
                    if current != Some(key_name.as_str()) {
                        return;
                    }
                    match path {
                        SignerPath::Claims => s.data.bridge.claims_signer = Some(signer),
                        SignerPath::Admin => s.data.bridge.admin_signer = Some(signer),
                    }
                });
            }
            Err(e) => {
                warn!(?path, error = %e, "bridge signer not loaded, retrying in 30 s");
                all_loaded = false;
            }
        }
    }

    if all_loaded {
        crate::bridge::jobs::start_first_ticks();
    } else {
        ic_cdk_timers::set_timer(LOAD_SIGNERS_RETRY, load_signers());
    }
}

async fn fetch_signer(path: SignerPath, key_name: &str) -> Result<EvmSigner, String> {
    let args = EcdsaPublicKeyArgs {
        canister_id: None,
        derivation_path: path.derivation_path(),
        key_id: SignerPath::key_id(key_name),
    };
    let result = ic_cdk_management_canister::ecdsa_public_key(&args)
        .await
        .map_err(|e| format!("ecdsa_public_key failed: {e:?}"))?;
    let address = try_evm_address(&result.public_key)?;
    Ok(EvmSigner {
        public_key: result.public_key,
        address,
    })
}

/// Signs `digest` with the key at `path` and returns `r || s || v` as OpenZeppelin's
/// `ECDSA.recover` accepts it: low-s, and `v` 27 or 28. Fails while the bridge has no config
/// or the path's public key is not loaded yet, since `v` is found against that key.
pub async fn sign_digest(path: SignerPath, digest: [u8; 32]) -> Result<[u8; 65], String> {
    // The key name and the public key are read together. A key name change clears both
    // signers and `load_signers` keeps only keys for the current name, so they always match.
    let (args, public_key) = read_state(|s| sign_request(&s.data.bridge, path, digest))?;
    let result = ic_cdk_management_canister::sign_with_ecdsa(&args)
        .await
        .map_err(|e| format!("sign_with_ecdsa failed: {e:?}"))?;
    let sig64: [u8; 64] = result.signature.as_slice().try_into().map_err(|_| {
        format!(
            "sign_with_ecdsa returned {} bytes, expected 64",
            result.signature.len()
        )
    })?;
    normalize_signature(sig64, digest, &public_key)
}

/// The `sign_with_ecdsa` arguments for `path`, and the public key the signature must recover to.
fn sign_request(
    bridge: &BridgeState,
    path: SignerPath,
    digest: [u8; 32],
) -> Result<(SignWithEcdsaArgs, Vec<u8>), String> {
    let config = bridge
        .config
        .as_ref()
        .ok_or_else(|| "the bridge has no config".to_string())?;
    let signer = match path {
        SignerPath::Claims => bridge.claims_signer.as_ref(),
        SignerPath::Admin => bridge.admin_signer.as_ref(),
    }
    .ok_or_else(|| format!("the {path:?} public key is not loaded yet"))?;
    let args = SignWithEcdsaArgs {
        message_hash: digest.to_vec(),
        derivation_path: path.derivation_path(),
        key_id: SignerPath::key_id(&config.ecdsa_key_name),
    };
    Ok((args, signer.public_key.clone()))
}

/// Turns a 64-byte `r || s` from `sign_with_ecdsa` into the 65 bytes Ethereum takes.
///
/// tECDSA returns a high `s` about half the time, and OpenZeppelin rejects those, so a high
/// `s` becomes `n - s`. Then `v` is 27 or 28, whichever recovers `expected_pubkey` (SEC1,
/// compressed or not). Recovery ids 2 and 3 (`r` above the group order) have no Ethereum `v`,
/// so such a signature is an error, as is any signature that does not match the key.
pub fn normalize_signature(
    sig64: [u8; 64],
    digest: [u8; 32],
    expected_pubkey: &[u8],
) -> Result<[u8; 65], String> {
    let expected = VerifyingKey::from_sec1_bytes(expected_pubkey)
        .map_err(|_| "the expected public key is not a secp256k1 key".to_string())?;
    // rejects r or s that is zero or not below the group order
    let sig = Signature::from_slice(&sig64)
        .map_err(|_| "the signature is not a valid secp256k1 r and s".to_string())?;
    // low-s first: k256 recovery rejects a high s
    let sig = sig.normalize_s().unwrap_or(sig);
    for y_odd in [false, true] {
        let recovered =
            VerifyingKey::recover_from_prehash(&digest, &sig, RecoveryId::new(y_odd, false));
        if matches!(&recovered, Ok(key) if *key == expected) {
            let mut out = [0u8; 65];
            out[..64].copy_from_slice(&sig.to_bytes());
            out[64] = 27 + y_odd as u8;
            return Ok(out);
        }
    }
    Err("the signature does not recover to the expected public key".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::bridge::config::test_fixtures::configured_state;
    use crate::bridge::evm::vectors::{self, public_key, signing_key, to_bytes64};
    use alloy_primitives::{hex, keccak256, U256};
    use k256::ecdsa::{Signature, SigningKey};
    use k256::elliptic_curve::scalar::IsHigh;

    /// The order of the secp256k1 group.
    const N: [u8; 32] = hex!("fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141");

    #[test]
    fn high_s_signature_is_normalized_and_recovers() {
        let file = vectors::load();
        let key = signing_key();
        let pubkey = public_key(&key);
        let signer = vectors::address(&file.signer);
        assert_eq!(evm_address(&pubkey), signer);

        let signed: Vec<(String, String)> = file
            .claims
            .iter()
            .map(|c| (c.digest.clone(), c.signature.clone()))
            .chain(
                file.executes
                    .iter()
                    .map(|e| (e.digest.clone(), e.signature.clone())),
            )
            .collect();
        assert_eq!(signed.len(), 5);

        for (digest, signature) in signed {
            let digest = vectors::bytes32(&digest);
            let (low, recovery_id) = key.sign_prehash_recoverable(&digest).unwrap();
            assert!(low.normalize_s().is_none(), "k256 signs low-s");

            // force s' = n - s
            let (r, s) = low.split_scalars();
            let high = Signature::from_scalars(r.to_bytes(), (-*s).to_bytes()).unwrap();
            assert!(bool::from(high.s().is_high()));
            assert_eq!(high.r().to_bytes(), r.to_bytes());
            assert_eq!(
                Some(U256::from_be_slice(&high.s().to_bytes())),
                U256::from_be_bytes(N).checked_sub(U256::from_be_slice(&s.to_bytes()))
            );

            let out = normalize_signature(to_bytes64(&high), digest, &pubkey).unwrap();
            assert_eq!(&out[..64], &low.to_bytes()[..], "low-s again");
            assert_eq!(out[64], 27 + recovery_id.to_byte());
            assert_eq!(
                vectors::recover(digest, &format!("0x{}", hex::encode(out))),
                signer
            );
            assert_eq!(format!("0x{}", hex::encode(out)), signature);

            // a low-s input comes out unchanged, and an uncompressed key works the same
            assert_eq!(
                normalize_signature(to_bytes64(&low), digest, &pubkey).unwrap(),
                out
            );
            let uncompressed = key.verifying_key().to_encoded_point(false);
            assert_eq!(
                normalize_signature(to_bytes64(&high), digest, uncompressed.as_bytes()).unwrap(),
                out
            );
        }
    }

    #[test]
    fn normalize_finds_both_v_values() {
        let key = signing_key();
        let pubkey = public_key(&key);
        let mut seen = [false; 2];
        for i in 0u32..32 {
            let digest = keccak256(i.to_be_bytes()).0;
            let (low, recovery_id) = key.sign_prehash_recoverable(&digest).unwrap();
            assert!(!recovery_id.is_x_reduced());
            let out = normalize_signature(to_bytes64(&low), digest, &pubkey).unwrap();
            assert_eq!(out[64], 27 + recovery_id.to_byte());
            seen[recovery_id.is_y_odd() as usize] = true;
        }
        assert_eq!(seen, [true, true], "both v = 27 and v = 28 occur");
    }

    #[test]
    fn normalize_rejects_wrong_key_and_malformed_signatures() {
        let key = signing_key();
        let pubkey = public_key(&key);
        let digest = keccak256("gldt").0;
        let (low, _) = key.sign_prehash_recoverable(&digest).unwrap();
        let sig = to_bytes64(&low);
        assert!(normalize_signature(sig, digest, &pubkey).is_ok());

        // another key, a malformed key, another digest
        let other = SigningKey::from_slice(&[0x11; 32]).unwrap();
        assert!(normalize_signature(sig, digest, &public_key(&other)).is_err());
        assert!(normalize_signature(sig, digest, &[]).is_err());
        assert!(normalize_signature(sig, digest, &[5; 33]).is_err());
        assert!(normalize_signature(sig, keccak256("other").0, &pubkey).is_err());

        // r or s zero, or not below n
        let (r, s) = sig.split_at(32);
        let r: [u8; 32] = r.try_into().unwrap();
        let s: [u8; 32] = s.try_into().unwrap();
        for (r, s) in [
            ([0u8; 32], s),
            (r, [0u8; 32]),
            (N, s),
            (r, N),
            ([0xff; 32], [0xff; 32]),
        ] {
            let mut bad = [0u8; 64];
            bad[..32].copy_from_slice(&r);
            bad[32..].copy_from_slice(&s);
            assert!(normalize_signature(bad, digest, &pubkey).is_err());
        }
    }

    #[test]
    fn sign_request_needs_config_and_loaded_signer() {
        let digest = [7u8; 32];
        let unconfigured = BridgeState::default();
        assert!(sign_request(&unconfigured, SignerPath::Claims, digest).is_err());

        let mut state = configured_state();
        assert!(sign_request(&state, SignerPath::Claims, digest).is_err());
        assert!(sign_request(&state, SignerPath::Admin, digest).is_err());

        let claims_key = public_key(&signing_key());
        let admin_key = public_key(&SigningKey::from_slice(&[0x22; 32]).unwrap());
        state.claims_signer = Some(EvmSigner {
            address: evm_address(&claims_key),
            public_key: claims_key.clone(),
        });
        assert!(sign_request(&state, SignerPath::Admin, digest).is_err());
        state.admin_signer = Some(EvmSigner {
            address: evm_address(&admin_key),
            public_key: admin_key.clone(),
        });

        for (path, key) in [
            (SignerPath::Claims, claims_key),
            (SignerPath::Admin, admin_key),
        ] {
            let (args, expected) = sign_request(&state, path, digest).unwrap();
            assert_eq!(args.message_hash, digest.to_vec());
            assert_eq!(args.derivation_path, path.derivation_path());
            assert_eq!(args.key_id, SignerPath::key_id("key_1"));
            assert_eq!(expected, key);
        }
    }

    #[test]
    fn derivation_paths_are_the_launch_constants() {
        assert_eq!(
            SignerPath::Claims.derivation_path(),
            vec![b"gldt-bridge-claims-v1".to_vec()]
        );
        assert_eq!(
            SignerPath::Admin.derivation_path(),
            vec![b"gldt-bridge-admin-v1".to_vec()]
        );
        assert_eq!(
            alloy_primitives::hex::encode(CLAIMS_PATH[0]),
            "676c64742d6272696467652d636c61696d732d7631"
        );
        assert_eq!(
            alloy_primitives::hex::encode(ADMIN_PATH[0]),
            "676c64742d6272696467652d61646d696e2d7631"
        );
    }
}
