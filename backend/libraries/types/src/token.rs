use std::{borrow::Cow, fmt::Display};

use candid::{CandidType, Nat, Principal};
use ic_stable_structures::{storable::Bound, Storable};

use serde::{Deserialize, Serialize};

#[derive(
    Debug, Serialize, Clone, Deserialize, CandidType, PartialEq, Eq, Hash, PartialOrd, Ord,
)]
pub struct TokenSymbolV0(pub String);

#[derive(Debug, PartialEq)]
pub enum TokenSymbolParseError {
    InvalidTokenSymbol,
}

impl Display for TokenSymbolParseError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::InvalidTokenSymbol => write!(f, "InvalidTokenSymbol"),
        }
    }
}

const MAX_VALUE_SIZE_V0: u32 = 12;
impl TokenSymbolV0 {
    pub fn parse(symbol: &str) -> Result<TokenSymbolV0, TokenSymbolParseError> {
        const ALLOWED_TOKENS: [&str; 2] = ["ICP", "OGY"];

        let valid_token = ALLOWED_TOKENS.contains(&symbol);
        if valid_token {
            Ok(TokenSymbolV0(symbol.to_string()))
        } else {
            Err(TokenSymbolParseError::InvalidTokenSymbol)
        }
    }
}

use candid::Decode;
use candid::Encode;
impl Storable for TokenSymbolV0 {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }
    fn into_bytes(self) -> std::vec::Vec<u8> {
        Encode!(&self).unwrap()
    }
    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(&bytes, Self).unwrap()
    }
    const BOUND: Bound = Bound::Bounded {
        max_size: MAX_VALUE_SIZE_V0,
        is_fixed_size: false,
    };
}

/// Compact enum for token identity (for keys, matching, etc.)
#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    Hash,
    PartialOrd,
    Ord,
    Serialize,
    Deserialize,
    CandidType,
    minicbor::Encode,
    minicbor::Decode,
)]
pub enum TokenSymbol {
    #[n(0)]
    ICP,
    #[n(1)]
    OGY,
    #[n(2)]
    GOLDAO,
    #[n(3)]
    WTN,
    #[n(4)]
    GLDT,
}

impl std::fmt::Display for TokenSymbol {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let symbol = match self {
            TokenSymbol::ICP => "ICP",
            TokenSymbol::OGY => "OGY",
            TokenSymbol::GOLDAO => "GOLDAO",
            TokenSymbol::WTN => "WTN",
            TokenSymbol::GLDT => "GLDT",
        };
        write!(f, "{symbol}")
    }
}

use std::cell::RefCell;
use std::collections::HashMap;

thread_local! {
    static __TOKENS: RefCell<HashMap<TokenSymbol, TokenInfo>> = RefCell::new(HashMap::new());
}

pub fn override_token_ledger(symbol: TokenSymbol, ledger_id: Principal, fee: Nat) {
    __TOKENS.with(|tokens| {
        let mut tokens = tokens.borrow_mut();
        tokens.insert(symbol, TokenInfo {
            ledger_id,
            fee,
            decimals: 8,
        });
    });
}

pub fn update_token_fee_cache(ledger_id: Principal, fee: Nat) {
    __TOKENS.with(|tokens| {
        let mut tokens = tokens.borrow_mut();
        let mut found_symbol = None;
        for (symbol, info) in tokens.iter() {
            if info.ledger_id == ledger_id {
                found_symbol = Some(*symbol);
                break;
            }
        }

        if let Some(symbol) = found_symbol {
            if let Some(info) = tokens.get_mut(&symbol) {
                info.fee = fee;
            }
        } else {
            let symbols = [
                TokenSymbol::ICP,
                TokenSymbol::OGY,
                TokenSymbol::GOLDAO,
                TokenSymbol::WTN,
                TokenSymbol::GLDT,
            ];
            for symbol in symbols {
                if symbol.ledger_id(true) == ledger_id || symbol.ledger_id(false) == ledger_id {
                    let info = TokenInfo {
                        ledger_id,
                        fee,
                        decimals: 8,
                    };
                    tokens.insert(symbol, info);
                    break;
                }
            }
        }
    });
}

pub async fn update_token_fee(ledger_id: Principal) -> Result<Nat, String> {
    let call_res = bity_ic_canister_client::make_c2c_call(
        ledger_id,
        "icrc1_fee",
        &(),
        candid::encode_one,
        |r| candid::decode_one::<candid::Nat>(r),
    )
    .await;
    match call_res {
        Ok(fee_nat) => {
            update_token_fee_cache(ledger_id, fee_nat.clone());
            Ok(fee_nat)
        }
        Err(e) => Err(format!("Ledger call failed: {:?}", e)),
    }
}

impl TokenSymbol {
    /// Return the display symbol for a token (can be renamed here)
    pub fn symbol(&self) -> &'static str {
        match self {
            TokenSymbol::ICP => "ICP",
            TokenSymbol::OGY => "OGY",
            TokenSymbol::GOLDAO => "GOLDAO",
            TokenSymbol::WTN => "WTN",
            TokenSymbol::GLDT => "GLDT",
        }
    }

    pub fn parse(symbol: &str) -> Result<Self, TokenSymbolParseError> {
        match symbol {
            "ICP" => Ok(TokenSymbol::ICP),
            "OGY" => Ok(TokenSymbol::OGY),
            "GOLDAO" | "GLDGov" => Ok(TokenSymbol::GOLDAO),
            "WTN" => Ok(TokenSymbol::WTN),
            "GLDT" => Ok(TokenSymbol::GLDT),
            _ => Err(TokenSymbolParseError::InvalidTokenSymbol),
        }
    }

    pub fn get_prod_token_info(self) -> TokenInfo {
        let cached = __TOKENS.with(|tokens| tokens.borrow().get(&self).cloned());
        if let Some(info) = cached {
            return info;
        }
        let ledger_id = self.ledger_id(false);
        TokenInfo {
            ledger_id,
            fee: Nat::from(match self {
                TokenSymbol::ICP => 10_000_u64,
                TokenSymbol::OGY => 200_000_u64,
                TokenSymbol::GOLDAO => 1_000_000_000_u64,
                TokenSymbol::WTN => 1_000_000_u64,
                TokenSymbol::GLDT => 10_000_000_u64,
            }),
            decimals: 8,
        }
    }

    pub fn get_token_info(self, is_test_mode: bool) -> TokenInfo {
        let cached = __TOKENS.with(|tokens| tokens.borrow().get(&self).cloned());
        if let Some(info) = cached {
            return info;
        }
        let ledger_id = self.ledger_id(is_test_mode);
        TokenInfo {
            ledger_id,
            fee: Nat::from(match self {
                TokenSymbol::ICP => 10_000_u64,
                TokenSymbol::OGY => 200_000_u64,
                TokenSymbol::GOLDAO => 1_000_000_000_u64,
                TokenSymbol::WTN => 1_000_000_u64,
                TokenSymbol::GLDT => 10_000_000_u64,
            }),
            decimals: 8,
        }
    }

    pub fn ledger_id(&self, test_mode: bool) -> Principal {
        match (self, test_mode) {
            (TokenSymbol::ICP, false) => Principal::from_text("ryjl3-tyaaa-aaaaa-aaaba-cai")
                .expect("Invalid ICP ledger principal"),
            (TokenSymbol::ICP, true) => Principal::from_text("ete3q-rqaaa-aaaal-qdlva-cai")
                .expect("Invalid test ICP ledger principal"),

            (TokenSymbol::OGY, false) => Principal::from_text("lkwrt-vyaaa-aaaaq-aadhq-cai")
                .expect("Invalid OGY ledger principal"),
            (TokenSymbol::OGY, true) => Principal::from_text("j5naj-nqaaa-aaaal-ajc7q-cai")
                .expect("Invalid test OGY ledger principal"),

            (TokenSymbol::GOLDAO, false) => Principal::from_text("tyyy3-4aaaa-aaaaq-aab7a-cai")
                .expect("Invalid GLDGov ledger principal"),
            (TokenSymbol::GOLDAO, true) => Principal::from_text("irhm6-5yaaa-aaaap-ab24q-cai")
                .expect("Invalid test GLDGov ledger principal"),

            (TokenSymbol::WTN, false) => Principal::from_text("jcmow-hyaaa-aaaaq-aadlq-cai")
                .expect("Invalid WTN ledger principal"),
            (TokenSymbol::WTN, true) => Principal::from_text("jcmow-hyaaa-aaaaq-aadlq-cai")
                .expect("Invalid test WTN ledger principal"),

            (TokenSymbol::GLDT, false) => Principal::from_text("6c7su-kiaaa-aaaar-qaira-cai")
                .expect("Invalid GLDT ledger principal"),
            (TokenSymbol::GLDT, true) => Principal::from_text("6uad6-fqaaa-aaaam-abovq-cai")
                .expect("Invalid test GLDT ledger principal"),
        }
    }

    pub fn is_valid(symbol: &str) -> bool {
        TokenSymbol::parse(symbol).is_ok()
    }
}

#[macro_export]
macro_rules! ledger_id {
    ($symbol:ident) => {{
        let is_test_mode = crate::state::read_state(|s| s.env.is_test_mode());
        types::TokenSymbol::$symbol.ledger_id(is_test_mode)
    }};
}

#[macro_export]
macro_rules! token_info {
    ($symbol:ident) => {{
        let is_test_mode = crate::state::read_state(|s| s.env.is_test_mode());
        types::TokenSymbol::$symbol.get_token_info(is_test_mode)
    }};
}

const MAX_VALUE_SIZE: u32 = 20;

impl Storable for TokenSymbol {
    fn to_bytes(&self) -> Cow<[u8]> {
        let mut buf = vec![];
        minicbor::encode(self, &mut buf).expect("token symbol encoding should always succeed");
        Cow::Owned(buf)
    }

    fn into_bytes(self) -> std::vec::Vec<u8> {
        let mut buf = vec![];
        minicbor::encode(self, &mut buf).expect("token symbol encoding should always succeed");
        buf
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        minicbor::decode(bytes.as_ref()).unwrap_or_else(|e| {
            panic!(
                "failed to decode token symbol bytes {}: {e}",
                hex::encode(bytes)
            )
        })
    }

    const BOUND: Bound = Bound::Bounded {
        max_size: MAX_VALUE_SIZE,
        is_fixed_size: false,
    };
}

#[derive(Debug, Serialize, Clone, Deserialize, CandidType, PartialEq, Eq, Hash)]
pub struct TokenInfo {
    pub ledger_id: Principal,
    pub fee: Nat,
    pub decimals: u64,
}

impl TokenInfo {
    pub fn validate(&self) -> Result<(), String> {
        if self.ledger_id == Principal::anonymous() {
            return Err("Invalid ledger_id: cannot be anonymous".to_string());
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use crate::token::MAX_VALUE_SIZE;
    use crate::TokenSymbol;
    use ic_stable_structures::Storable;

    #[test]
    fn test_token_symbol_encode_decode() {
        let symbols = [
            TokenSymbol::ICP,
            TokenSymbol::OGY,
            TokenSymbol::GOLDAO,
            TokenSymbol::WTN,
        ];
        for &symbol in &symbols {
            let mut buf = Vec::new();
            minicbor::encode(&symbol, &mut buf).unwrap();
            println!("Encoded {:?} to bytes: {:?}", symbol, buf);

            let decoded: TokenSymbol = minicbor::decode(&buf).unwrap();
            assert_eq!(decoded, symbol);
        }
    }

    #[test]
    fn test_token_symbol_encoded_size_within_limit() {
        let symbols = [
            TokenSymbol::ICP,
            TokenSymbol::OGY,
            TokenSymbol::GOLDAO,
            TokenSymbol::WTN,
        ];
        for &symbol in &symbols {
            let encoded = symbol.to_bytes();
            let size = encoded.len() as u32;
            println!("Encoded size for {:?}: {}", symbol, size);
            assert!(
                size <= MAX_VALUE_SIZE,
                "Encoded size of {:?} ({}) exceeds MAX_VALUE_SIZE ({})",
                symbol,
                size,
                MAX_VALUE_SIZE
            );
        }
    }

    #[test]
    fn test_token_symbol_parse() {
        use crate::TokenSymbol;

        // Valid symbols
        assert_eq!(TokenSymbol::parse("ICP"), Ok(TokenSymbol::ICP));
        assert_eq!(TokenSymbol::parse("OGY"), Ok(TokenSymbol::OGY));
        assert_eq!(TokenSymbol::parse("GOLDAO"), Ok(TokenSymbol::GOLDAO));
        assert_eq!(TokenSymbol::parse("GLDGov"), Ok(TokenSymbol::GOLDAO)); // alias
        assert_eq!(TokenSymbol::parse("WTN"), Ok(TokenSymbol::WTN));

        // Invalid symbols
        assert!(TokenSymbol::parse("icp").is_err()); // case-sensitive
        assert!(TokenSymbol::parse("goldao").is_err());
        assert!(TokenSymbol::parse("GLD").is_err());
        assert!(TokenSymbol::parse("").is_err());
        assert!(TokenSymbol::parse("UNKNOWN").is_err());
    }

    #[test]
    fn test_update_token_fee_cache() {
        use crate::token::{update_token_fee_cache, __TOKENS};
        use candid::Nat;

        // Clear the cache first to ensure a cache miss
        __TOKENS.with(|tokens| tokens.borrow_mut().clear());

        let ogy_ledger = TokenSymbol::OGY.ledger_id(true);
        let expected_fee = Nat::from(123_456_u64);

        // This call will trigger a cache miss and insert a new TokenInfo.
        // It must not panic on RefCell borrows.
        update_token_fee_cache(ogy_ledger, expected_fee.clone());

        // Verify the cache has been updated
        let info = TokenSymbol::OGY.get_token_info(true);
        assert_eq!(info.fee, expected_fee);

        // Verify cache hit behavior also works and updates the fee
        let new_expected_fee = Nat::from(789_012_u64);
        update_token_fee_cache(ogy_ledger, new_expected_fee.clone());
        let updated_info = TokenSymbol::OGY.get_token_info(true);
        assert_eq!(updated_info.fee, new_expected_fee);
    }
}
