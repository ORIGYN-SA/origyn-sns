use crate::bridge::evm::address::{format_address, parse_address};
use crate::state::read_state;
use crate::updates::swap_nft_for_evm::nfts_value;
use candid::{Decode, Nat};
pub use gldt_swap_api_canister::icrc21::Args as Icrc21Args;
pub use gldt_swap_api_canister::icrc21::Response as Icrc21Response;
use gldt_swap_api_canister::swap_nft_for_evm::SwapNftForEvmArgs;
use gldt_swap_common::bridge::{BridgeToEvmArgs, EvmChain};
use ic_cdk::query;
use icrc_ledger_types::icrc21::errors::ErrorInfo;
use icrc_ledger_types::icrc21::errors::Icrc21Error;
use icrc_ledger_types::icrc21::lib::MAX_CONSENT_MESSAGE_ARG_SIZE_BYTES;
use strum_macros::Display;
use strum_macros::EnumIter;
use strum_macros::EnumString;
pub use utils::icrcs::icrc21;
use utils::icrcs::icrc21::create_consent_info;
use utils::icrcs::icrc21::create_error_response;

#[derive(PartialEq, Debug, EnumString, EnumIter, Display)]
#[strum(serialize_all = "snake_case")]
pub enum Icrc21Function {
    SwapNftForTokens,
    SwapTokensForNft,
    BridgeToEvm,
    SwapNftForEvm,
}

#[query]
pub fn icrc21_canister_call_consent_message(args: Icrc21Args) -> Icrc21Response {
    if args.arg.len() > MAX_CONSENT_MESSAGE_ARG_SIZE_BYTES as usize {
        return Err(Icrc21Error::UnsupportedCanisterCall(ErrorInfo {
            description: format!(
                "The argument size is too large. The maximum allowed size is {} bytes.",
                MAX_CONSENT_MESSAGE_ARG_SIZE_BYTES
            ),
        }));
    }

    let message = match args.method.parse::<Icrc21Function>() {
        Ok(Icrc21Function::SwapNftForTokens) => handle_swap_nft_for_tokens_consent(args),
        Ok(Icrc21Function::SwapTokensForNft) => handle_swap_tokens_for_nft_consent(args),
        Ok(Icrc21Function::BridgeToEvm) => handle_bridge_to_evm_consent(args),
        Ok(Icrc21Function::SwapNftForEvm) => handle_swap_nft_for_evm_consent(args),
        Err(err) => {
            return Err(Icrc21Error::UnsupportedCanisterCall(ErrorInfo {
                description: format!("Unsupported method: {}", err),
            }));
        }
    };

    message
}

fn handle_swap_nft_for_tokens_consent(args: Icrc21Args) -> Icrc21Response {
    match Decode!(&args.arg, gldt_swap_api_canister::swap_nft_for_tokens::Args) {
        Ok(manage_args) => {
            let mut fields = vec![
                ("Action".to_string(), "Swap NFT For Tokens".to_string()),
                ("Method".to_string(), args.method.clone()),
            ];

            let nft_count = manage_args.len();
            fields.push(("Number of NFTs".to_string(), nft_count.to_string()));

            for (i, nft) in manage_args.iter().enumerate() {
                fields.push((format!("NFT #{} ID", i + 1), nft.id.to_string()));
                fields.push((
                    format!("NFT Canister ID #{}", i + 1),
                    nft.canister_id.to_string(),
                ));
            }

            let generic_message = format!(
                "You are about to swap {} NFTs for tokens: {:?}.",
                nft_count, manage_args
            );

            create_consent_info(
                generic_message,
                "Swap NFT For Tokens".to_string(),
                fields,
                args.user_preferences.metadata,
            )
        }
        Err(_) => {
            create_error_response("Failed to decode swap NFT for tokens arguments".to_string())
        }
    }
}
pub fn handle_swap_tokens_for_nft_consent(args: Icrc21Args) -> Icrc21Response {
    match Decode!(&args.arg, gldt_swap_api_canister::swap_tokens_for_nft::Args) {
        Ok(decoded_args) => {
            // decoded_args is now Vec<Nft>
            // Let's create a summary string for multiple NFTs
            let nft_count = decoded_args.len();

            // Create a string listing all NFT IDs and their canister IDs
            let nft_list_str = decoded_args
                .iter()
                .map(|nft| {
                    format!(
                        "ID: {} from Canister: {}",
                        nft.id.0,
                        nft.canister_id.to_text()
                    )
                })
                .collect::<Vec<_>>()
                .join("; ");

            // Fields describing the batch swap action
            let fields = vec![
                ("Action".to_string(), format!("Swap {} NFTs", nft_count)),
                ("Method".to_string(), args.method.clone()),
                ("NFTs".to_string(), nft_list_str.clone()),
            ];

            let generic_message = format!(
                "You are about to swap {} NFT(s): {}.",
                nft_count, nft_list_str
            );

            create_consent_info(
                generic_message,
                "NFT Swap".to_string(),
                fields,
                args.user_preferences.metadata,
            )
        }
        Err(_) => {
            create_error_response("Failed to decode swap tokens for NFT arguments".to_string())
        }
    }
}

fn handle_bridge_to_evm_consent(args: Icrc21Args) -> Icrc21Response {
    let Ok(call) = Decode!(&args.arg, gldt_swap_api_canister::bridge_to_evm::Args) else {
        return create_error_response("Failed to decode bridge_to_evm arguments".to_string());
    };
    match bridge_to_evm_consent(&call) {
        Ok((message, fields)) => create_consent_info(
            message,
            format!("Bridge GLDT to {}", chain_name(call.chain)),
            fields,
            args.user_preferences.metadata,
        ),
        Err(e) => create_error_response(e),
    }
}

/// The consent message for `bridge_to_evm`, for example "Burn 12.5 GLDT on ICP to receive
/// 12.5 GLDT at 0xAbCd…12Ef on Base", and the fields shown with it. The fields carry the full
/// recipient, because a lookalike address can share the short form's ends.
pub fn bridge_to_evm_consent(
    args: &BridgeToEvmArgs,
) -> Result<(String, Vec<(String, String)>), String> {
    let recipient = parse_address(&args.recipient)
        .ok()
        .filter(|address| *address != [0u8; 20])
        .map(|address| format_address(&address))
        .ok_or_else(|| format!("{:?} is not an EVM recipient address", args.recipient))?;
    let amount = format_gldt(&args.amount);
    let chain = chain_name(args.chain);
    let message = format!(
        "Burn {amount} GLDT on ICP to receive {amount} GLDT at {} on {chain}",
        short_address(&recipient)
    );
    let from_subaccount = match args.from_subaccount {
        Some(subaccount) if subaccount != [0u8; 32] => alloy_primitives::hex::encode(subaccount),
        _ => "default".to_string(),
    };
    let fields = vec![
        ("Chain".to_string(), chain.to_string()),
        ("Recipient".to_string(), recipient),
        (
            "Amount".to_string(),
            format!("{amount} GLDT ({} e8s)", args.amount.0),
        ),
        ("From subaccount".to_string(), from_subaccount),
    ];
    Ok((message, fields))
}

fn handle_swap_nft_for_evm_consent(args: Icrc21Args) -> Icrc21Response {
    let Ok(call) = Decode!(&args.arg, gldt_swap_api_canister::swap_nft_for_evm::Args) else {
        return create_error_response("Failed to decode swap_nft_for_evm arguments".to_string());
    };
    let value = read_state(|s| nfts_value(&s.data.swap_configs, &call.nfts))
        .map_err(|e| format!("not every NFT can be swapped: {e}"));
    match value.and_then(|value| swap_nft_for_evm_consent(&call, &value)) {
        Ok((message, fields)) => create_consent_info(
            message,
            format!("Swap NFTs for GLDT on {}", chain_name(call.chain)),
            fields,
            args.user_preferences.metadata,
        ),
        Err(e) => create_error_response(e),
    }
}

/// The consent message for `swap_nft_for_evm`, for example "Swap 2 NFTs worth 2000 GLDT to
/// receive 2000 GLDT at 0xAbCd…12Ef on Ethereum", and the fields shown with it. `value` is the
/// GLDT value of the NFTs in e8s. The fields carry the full recipient, as for `bridge_to_evm`.
pub fn swap_nft_for_evm_consent(
    args: &SwapNftForEvmArgs,
    value: &Nat,
) -> Result<(String, Vec<(String, String)>), String> {
    let recipient = parse_address(&args.recipient)
        .ok()
        .filter(|address| *address != [0u8; 20])
        .map(|address| format_address(&address))
        .ok_or_else(|| format!("{:?} is not an EVM recipient address", args.recipient))?;
    let amount = format_gldt(value);
    let chain = chain_name(args.chain);
    let count = args.nfts.len();
    let message = format!(
        "Swap {count} {} worth {amount} GLDT to receive {amount} GLDT at {} on {chain}",
        if count == 1 { "NFT" } else { "NFTs" },
        short_address(&recipient)
    );
    let mut nfts: Vec<_> = args.nfts.iter().collect();
    nfts.sort();
    let nft_list = nfts
        .iter()
        .map(|nft| format!("{} from {}", nft.id, nft.canister_id))
        .collect::<Vec<_>>()
        .join("; ");
    let fields = vec![
        ("Chain".to_string(), chain.to_string()),
        ("Recipient".to_string(), recipient),
        ("Number of NFTs".to_string(), count.to_string()),
        ("NFTs".to_string(), nft_list),
        (
            "Amount".to_string(),
            format!("{amount} GLDT ({} e8s)", value.0),
        ),
    ];
    Ok((message, fields))
}

fn chain_name(chain: EvmChain) -> &'static str {
    match chain {
        EvmChain::Ethereum => "Ethereum",
        EvmChain::Base => "Base",
    }
}

/// `0x` and the first and last 4 hex digits of an EIP-55 address.
fn short_address(eip55: &str) -> String {
    let digits = &eip55[2..];
    format!("0x{}\u{2026}{}", &digits[..4], &digits[digits.len() - 4..])
}

/// e8s as GLDT (8 decimals), without trailing zeros: 1_250_000_000 is "12.5".
pub fn format_gldt(e8s: &Nat) -> String {
    let whole = &e8s.0 / 100_000_000u64;
    let fraction = &e8s.0 % 100_000_000u64;
    if fraction == 0u64.into() {
        return whole.to_string();
    }
    let fraction = format!("{fraction:0>8}");
    format!("{whole}.{}", fraction.trim_end_matches('0'))
}

#[cfg(test)]
mod tests {
    use super::*;
    use candid::{Encode, Nat};
    use gldt_swap_common::bridge::{BridgeToEvmArgs, EvmChain};
    use icrc_ledger_types::icrc21::requests::{ConsentMessageMetadata, ConsentMessageSpec};
    use icrc_ledger_types::icrc21::responses::ConsentMessage;

    const RECIPIENT: &str = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

    fn bridge_args(recipient: &str, amount: u64) -> BridgeToEvmArgs {
        BridgeToEvmArgs {
            chain: EvmChain::Base,
            recipient: recipient.to_string(),
            amount: Nat::from(amount),
            from_subaccount: None,
        }
    }

    #[test]
    fn gldt_amounts_print_without_trailing_zeros() {
        assert_eq!(format_gldt(&Nat::from(0u8)), "0");
        assert_eq!(format_gldt(&Nat::from(1u8)), "0.00000001");
        assert_eq!(format_gldt(&Nat::from(100_000_000u64)), "1");
        assert_eq!(format_gldt(&Nat::from(1_250_000_000u64)), "12.5");
        assert_eq!(format_gldt(&Nat::from(123_456_789_012u64)), "1234.56789012");
        assert_eq!(
            format_gldt(&Nat::from(u128::MAX)),
            "3402823669209384634633746074317.68211455"
        );
    }

    #[test]
    fn bridge_to_evm_consent_names_amount_recipient_and_chain() {
        let (message, fields) =
            bridge_to_evm_consent(&bridge_args(&RECIPIENT.to_lowercase(), 1_250_000_000)).unwrap();
        assert_eq!(
            message,
            "Burn 12.5 GLDT on ICP to receive 12.5 GLDT at 0x7099\u{2026}79C8 on Base"
        );
        let field = |name: &str| {
            fields
                .iter()
                .find(|(key, _)| key == name)
                .map(|(_, value)| value.clone())
                .unwrap_or_else(|| panic!("no field {name}"))
        };
        // the full address, so a lookalike with the same ends is caught
        assert_eq!(field("Recipient"), RECIPIENT);
        assert_eq!(field("Chain"), "Base");
        assert_eq!(field("Amount"), "12.5 GLDT (1250000000 e8s)");
        assert_eq!(field("From subaccount"), "default");

        let mut with_subaccount = bridge_args(RECIPIENT, 1);
        with_subaccount.from_subaccount = Some([0xab; 32]);
        let (_, fields) = bridge_to_evm_consent(&with_subaccount).unwrap();
        assert!(fields
            .iter()
            .any(|(key, value)| key == "From subaccount" && *value == "ab".repeat(32)));

        assert!(bridge_to_evm_consent(&bridge_args(&format!("0x{}", "0".repeat(40)), 1)).is_err());
        assert!(bridge_to_evm_consent(&bridge_args("0x1234", 1)).is_err());
    }

    fn nft(id: u64) -> gldt_swap_common::nft::Nft {
        gldt_swap_common::nft::Nft {
            id: Nat::from(id),
            canister_id: candid::Principal::from_slice(&[1; 10]),
        }
    }

    fn evm_args(recipient: &str, nfts: &[u64]) -> SwapNftForEvmArgs {
        SwapNftForEvmArgs {
            nfts: nfts.iter().map(|id| nft(*id)).collect(),
            chain: EvmChain::Ethereum,
            recipient: recipient.to_string(),
        }
    }

    #[test]
    fn swap_nft_for_evm_consent_names_nfts_amount_recipient_and_chain() {
        let value = Nat::from(200_000_000_000u64);
        let (message, fields) =
            swap_nft_for_evm_consent(&evm_args(&RECIPIENT.to_lowercase(), &[2, 1]), &value)
                .unwrap();
        assert_eq!(
            message,
            "Swap 2 NFTs worth 2000 GLDT to receive 2000 GLDT at 0x7099\u{2026}79C8 on Ethereum"
        );
        let field = |name: &str| {
            fields
                .iter()
                .find(|(key, _)| key == name)
                .map(|(_, value)| value.clone())
                .unwrap_or_else(|| panic!("no field {name}"))
        };
        assert_eq!(field("Recipient"), RECIPIENT);
        assert_eq!(field("Chain"), "Ethereum");
        assert_eq!(field("Number of NFTs"), "2");
        assert_eq!(field("Amount"), "2000 GLDT (200000000000 e8s)");
        let collection = candid::Principal::from_slice(&[1; 10]);
        assert_eq!(
            field("NFTs"),
            format!("1 from {collection}; 2 from {collection}")
        );

        let (message, _) =
            swap_nft_for_evm_consent(&evm_args(RECIPIENT, &[1]), &Nat::from(1_250_000_000u64))
                .unwrap();
        assert!(
            message.starts_with("Swap 1 NFT worth 12.5 GLDT"),
            "{message}"
        );

        assert!(swap_nft_for_evm_consent(
            &evm_args(&format!("0x{}", "0".repeat(40)), &[1]),
            &value
        )
        .is_err());
        assert!(swap_nft_for_evm_consent(&evm_args("0x1234", &[1]), &value).is_err());
    }

    #[test]
    fn consent_endpoint_values_the_nfts_from_the_swap_configs() {
        use crate::model::swap_configs::SwapConfigs;
        use crate::state::{mutate_state, RuntimeState};
        use gldt_swap_common::swap_canister_config::{
            FractionalizationConfig, GeneralFractionalizationConfig, SwapCanisterConfig,
        };

        crate::bridge::test_state::install(RuntimeState::default());
        mutate_state(|s| {
            s.data.swap_configs = SwapConfigs::from_vec(vec![SwapCanisterConfig {
                icrc7_canister_id: candid::Principal::from_slice(&[1; 10]),
                fractionalization_config: FractionalizationConfig::General(
                    GeneralFractionalizationConfig {
                        division: 100_000_000_000,
                        swap_fee: Nat::from(100_000_000u64),
                        ledger_id: candid::Principal::from_slice(&[2; 10]),
                    },
                ),
            }]);
        });
        let request = |arg: Vec<u8>| Icrc21Args {
            method: "swap_nft_for_evm".to_string(),
            arg,
            user_preferences: ConsentMessageSpec {
                metadata: ConsentMessageMetadata {
                    language: "en".to_string(),
                    utc_offset_minutes: None,
                },
                device_spec: None,
            },
        };
        let arg = Encode!(&evm_args(RECIPIENT, &[1, 2, 3])).unwrap();
        let info = icrc21_canister_call_consent_message(request(arg)).unwrap();
        let ConsentMessage::GenericDisplayMessage(text) = info.consent_message else {
            panic!("expected a generic display message");
        };
        assert!(
            text.contains(
                "Swap 3 NFTs worth 3000 GLDT to receive 3000 GLDT at 0x7099\u{2026}79C8 on Ethereum"
            ),
            "{text}"
        );
        assert!(text.contains(RECIPIENT), "{text}");

        // an NFT of a collection the swap does not know
        let mut unknown = evm_args(RECIPIENT, &[1]);
        unknown.nfts.insert(gldt_swap_common::nft::Nft {
            id: Nat::from(1u8),
            canister_id: candid::Principal::from_slice(&[9; 10]),
        });
        assert!(icrc21_canister_call_consent_message(request(Encode!(&unknown).unwrap())).is_err());
        // undecodable arguments are refused
        assert!(icrc21_canister_call_consent_message(request(vec![1, 2, 3])).is_err());
    }

    #[test]
    fn consent_endpoint_handles_bridge_to_evm() {
        let request = |method: &str, arg: Vec<u8>| Icrc21Args {
            method: method.to_string(),
            arg,
            user_preferences: ConsentMessageSpec {
                metadata: ConsentMessageMetadata {
                    language: "en".to_string(),
                    utc_offset_minutes: None,
                },
                device_spec: None,
            },
        };
        let arg = Encode!(&bridge_args(RECIPIENT, 1_250_000_000)).unwrap();
        let info = icrc21_canister_call_consent_message(request("bridge_to_evm", arg)).unwrap();
        let ConsentMessage::GenericDisplayMessage(text) = info.consent_message else {
            panic!("expected a generic display message");
        };
        assert!(
            text.contains(
                "Burn 12.5 GLDT on ICP to receive 12.5 GLDT at 0x7099\u{2026}79C8 on Base"
            ),
            "{text}"
        );
        assert!(text.contains(RECIPIENT), "{text}");

        // undecodable arguments are refused
        assert!(
            icrc21_canister_call_consent_message(request("bridge_to_evm", vec![1, 2, 3])).is_err()
        );
    }
}
