//! The canister's two threshold ECDSA keys and their Ethereum addresses.
//!
//! The derivation paths are code constants, never config, so an upgrade argument
//! can't move the signer addresses. Mainnet `key_1` gives claims
//! `0x0A82D20142d067C8AF32f48664bDDfb65EcAE507` and admin
//! `0x216C1E5F2b9EB767Cec5C7d4DFa2d02b5A0AA143`.

pub use crate::bridge::evm::address::evm_address;
use crate::bridge::evm::address::{format_address, try_evm_address};
use crate::bridge::state::EvmSigner;
use crate::state::{mutate_state, read_state};
use ic_cdk_management_canister::{EcdsaCurve, EcdsaKeyId, EcdsaPublicKeyArgs};
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

    if !all_loaded {
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

#[cfg(test)]
mod tests {
    use super::*;

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
