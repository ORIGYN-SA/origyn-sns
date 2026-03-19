use candid::{Nat, Principal};
use num_bigint::BigUint;
use token_metrics_api::types::ledger_indexer::{
    DEFAULT_SUBACCOUNT, DEFAULT_SUBACCOUNT_HEX, IcrcAccount, LedgerAccount,
};

pub fn nearest_past_hour(time_nano: u64) -> u64 {
    const NANO_PER_HOUR: u64 = 3_600_000_000_000;
    time_nano - (time_nano % NANO_PER_HOUR)
}

pub fn nearest_day_start(time_nano: u64) -> u64 {
    const NANO_PER_DAY: u64 = 86_400_000_000_000;
    time_nano - (time_nano % NANO_PER_DAY)
}

/// Parse "principal.subaccount_hex" → LedgerAccount (canonicalized).
/// Returns None if the format is invalid.
pub fn text_to_account(s: &str) -> Option<LedgerAccount> {
    let parts: Vec<&str> = s.splitn(2, '.').collect();
    if parts.len() == 2 {
        let principal = Principal::from_text(parts[0]).ok()?;
        let sub_hex = parts[1];
        let sub_bytes = hex::decode(sub_hex).ok()?;
        if sub_bytes.len() != 32 {
            return None;
        }
        let mut subaccount = [0u8; 32];
        subaccount.copy_from_slice(&sub_bytes);
        Some(LedgerAccount {
            owner: principal,
            subaccount: Some(subaccount),
        })
    } else {
        // Bare principal — use default subaccount
        let principal = Principal::from_text(s).ok()?;
        Some(LedgerAccount {
            owner: principal,
            subaccount: Some(DEFAULT_SUBACCOUNT),
        })
    }
}

/// Format LedgerAccount → "principal.subaccount_hex"
pub fn account_to_text(a: &LedgerAccount) -> String {
    let pr = a.owner.to_text();
    let sa = match &a.subaccount {
        Some(sub) => hex::encode(sub),
        None => DEFAULT_SUBACCOUNT_HEX.to_string(),
    };
    format!("{}.{}", pr, sa)
}

/// Extract principal from account text or bare principal text.
pub fn text_to_principal(s: &str) -> Option<Principal> {
    let parts: Vec<&str> = s.splitn(2, '.').collect();
    Principal::from_text(parts[0]).ok()
}

/// Canonicalize: ensure subaccount is always Some.
pub fn canonicalize_account(mut a: LedgerAccount) -> LedgerAccount {
    if a.subaccount.is_none() {
        a.subaccount = Some(DEFAULT_SUBACCOUNT);
    }
    a
}

/// Build range bounds for all subaccounts of a principal.
pub fn principal_account_range(p: Principal) -> (LedgerAccount, LedgerAccount) {
    let start = LedgerAccount {
        owner: p,
        subaccount: Some([0u8; 32]),
    };
    let end = LedgerAccount {
        owner: p,
        subaccount: Some([0xff; 32]),
    };
    (start, end)
}

/// Convert IcrcAccount (Candid) → canonicalized LedgerAccount.
pub fn icrc_account_to_account(a: &IcrcAccount) -> LedgerAccount {
    let subaccount = match &a.subaccount {
        Some(v) => {
            let mut sub = [0u8; 32];
            let len = v.len().min(32);
            sub[..len].copy_from_slice(&v[..len]);
            sub
        }
        None => DEFAULT_SUBACCOUNT,
    };
    LedgerAccount {
        owner: a.owner,
        subaccount: Some(subaccount),
    }
}

/// Convert IcrcAccount to "principal.subaccount_hex" string (for ProcessedTX fields).
pub fn icrc_account_to_string(account: IcrcAccount) -> String {
    let pr = account.owner.to_text();
    let sa = match account.subaccount {
        Some(v) => hex::encode(v),
        None => DEFAULT_SUBACCOUNT_HEX.to_string(),
    };
    format!("{}.{}", pr, sa)
}

/// Parse "principal.subaccount_hex" into (principal_str, subaccount_hex_str).
/// Used by time_stats for aggregating ProcessedTX strings.
pub fn parse_icrc_account(input: &str) -> Option<(String, String)> {
    let parts: Vec<&str> = input.split('.').collect();
    if parts.len() == 2 {
        Some((parts[0].to_string(), parts[1].to_string()))
    } else {
        None
    }
}

pub fn nat_to_u128(nat: Nat) -> Result<u128, String> {
    let big: &BigUint = &nat.0;
    big.try_into()
        .map_err(|_| format!("Nat value too large for u128: {}", nat))
}

pub fn nat_to_u64(nat: Nat) -> Result<u64, String> {
    let big: &BigUint = &nat.0;
    big.try_into()
        .map_err(|_| format!("Nat value too large for u64: {}", nat))
}

#[cfg(target_arch = "wasm32")]
pub fn timestamp_nanos() -> u64 {
    ic_cdk::api::time()
}

#[cfg(not(target_arch = "wasm32"))]
pub fn timestamp_nanos() -> u64 {
    use std::time::SystemTime;
    SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap()
        .as_nanos() as u64
}
