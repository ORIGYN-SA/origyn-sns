use crate::guards::{balancer_running, reject_anonymous_caller, GuardNft};
use crate::model::nft_batches::{nft_transfer_outcome, GroupedNftsByCanister, NftTransferOutcome};
use crate::state::{icrc3_commit_prepared_transaction, mutate_state, read_state, RuntimeState};
use crate::utils::prepare_transactions;
use bity_ic_canister_time::SECOND_IN_MS;
use candid::{Nat, Principal};
use gldt_swap_api_canister::swap_nft_for_tokens::SwapNftForTokensErrors;
pub use gldt_swap_api_canister::swap_nft_for_tokens::{
    Args as SwapNftForTokensArgs, Response as SwapNftForTokensResponse,
};
use gldt_swap_api_canister::swap_tokens_for_nft::RetryInMilliseconds;
use gldt_swap_common::general_error::GeneralError;
use gldt_swap_common::nft::Nft;
use gldt_swap_common::swap::{SwapIndex, SwapInfo, SwapStatus, SwapType};
use ic_cdk::api::msg_caller;
use ic_cdk::update;
use icrc_ledger_canister_c2c_client::icrc1_transfer;
use icrc_ledger_types::icrc1::account::Account;
use icrc_ledger_types::icrc1::transfer::TransferArg;
use std::collections::{BTreeMap, HashMap, HashSet};
use tracing::{error, info};

#[update]
async fn swap_nft_for_tokens(args: SwapNftForTokensArgs) -> SwapNftForTokensResponse {
    swap_nft_for_tokens_impl(args).await
}

pub async fn swap_nft_for_tokens_impl(args: SwapNftForTokensArgs) -> SwapNftForTokensResponse {
    let _span = tracing::info_span!("SWAP_NFT_FOR_TOKENS").entered();

    let caller = msg_caller();
    let (swap_ids, ()) = forward_swap(caller, args, &mut MintOnIcp).await?;
    Ok(swap_ids)
}

/// Step 3 of the forward swap, the one step `swap_nft_for_tokens` and `swap_nft_for_evm` do
/// differently: what the caller gets for the NFTs that moved to gldt_swap.
pub(crate) trait ForwardPayout {
    /// The swap's own errors, or the payout's.
    type Error: From<SwapNftForTokensErrors>;
    /// Returned with the swap ids.
    type Receipt;

    /// The payout's own checks of `nfts`. They run after the swap's checks, and again right
    /// before the swaps are created, after the last await before the NFTs move: a refusal
    /// changes nothing and moves no NFT.
    fn check(&mut self, nfts: &HashSet<Nft>) -> Result<(), Self::Error>;

    /// Issues the GLDT of the swaps whose NFT moved (`moved`), each for the value its swap
    /// records.
    async fn issue(
        &mut self,
        caller: Principal,
        swaps: &HashMap<SwapIndex, SwapInfo>,
        moved: Vec<SwapIndex>,
    ) -> Result<Issued, Self::Error>;

    /// Runs in the `mutate_state` that marks the `issued` swaps `Minted` and every swap
    /// `Complete`, with no await since `issue`.
    fn record(
        &mut self,
        state: &mut RuntimeState,
        caller: Principal,
        swaps: &HashMap<SwapIndex, SwapInfo>,
        issued: &[SwapIndex],
    ) -> Self::Receipt;
}

/// What [`ForwardPayout::issue`] did.
pub(crate) struct Issued {
    /// The swaps whose GLDT was issued.
    pub issued: Vec<SwapIndex>,
    /// The swaps whose GLDT was not issued, each with the reason; their NFT is given back.
    pub failed: Vec<(SwapIndex, String)>,
}

/// `swap_nft_for_tokens`: the GLDT is minted to the caller on ICP.
struct MintOnIcp;

impl ForwardPayout for MintOnIcp {
    type Error = SwapNftForTokensErrors;
    type Receipt = ();

    fn check(&mut self, _nfts: &HashSet<Nft>) -> Result<(), Self::Error> {
        Ok(())
    }

    async fn issue(
        &mut self,
        caller: Principal,
        swaps: &HashMap<SwapIndex, SwapInfo>,
        moved: Vec<SwapIndex>,
    ) -> Result<Issued, Self::Error> {
        // one mint per ledger, of the moved swaps' recorded values
        let mut tokens_amount: BTreeMap<Principal, Nat> = BTreeMap::new();
        for swap in moved.iter().filter_map(|id| swaps.get(id)) {
            *tokens_amount
                .entry(swap.tokens_amount.ledger_id)
                .or_insert_with(|| Nat::from(0u8)) += Nat::from(swap.tokens_amount.division);
        }

        let transfer_args: Vec<_> = tokens_amount
            .iter()
            .map(|(canister_id, amount)| {
                (
                    *canister_id,
                    TransferArg {
                        from_subaccount: None,
                        to: Account {
                            owner: caller,
                            subaccount: None,
                        },
                        fee: None,
                        created_at_time: None,
                        memo: None,
                        amount: amount.clone(),
                    },
                )
            })
            .collect();

        let transfers_futures = transfer_args
            .iter()
            .map(|(token_canister_id, transfer_arg)| {
                icrc1_transfer(*token_canister_id, transfer_arg)
            })
            .collect::<Vec<_>>();

        let transfer_results = futures::future::join_all(transfers_futures).await;
        let minted: HashMap<Principal, Result<(), String>> = transfer_args
            .iter()
            .zip(transfer_results)
            .map(|((ledger_id, _transfer_arg), result)| {
                let result = match result {
                    Ok(Ok(_block_index)) => Ok(()),
                    Ok(Err(transfer_err)) => {
                        Err(format!("Token transfer failed: {:?}", transfer_err))
                    }
                    Err(call_err) => Err(format!("IC call failed: {:?}", call_err)),
                };
                (*ledger_id, result)
            })
            .collect();

        // each moved swap by the mint of its own ledger
        let mut issued = Issued {
            issued: Vec::new(),
            failed: Vec::new(),
        };
        for swap_id in moved {
            let mint = swaps
                .get(&swap_id)
                .and_then(|swap| minted.get(&swap.tokens_amount.ledger_id));
            match mint {
                Some(Ok(())) => issued.issued.push(swap_id),
                Some(Err(reason)) => {
                    error!("Mint failed for swap {:?}: {}", swap_id, reason);
                    issued.failed.push((swap_id, reason.clone()));
                }
                None => issued
                    .failed
                    .push((swap_id, "No mint for this swap's ledger".to_string())),
            }
        }
        Ok(issued)
    }

    fn record(
        &mut self,
        _state: &mut RuntimeState,
        _caller: Principal,
        _swaps: &HashMap<SwapIndex, SwapInfo>,
        _issued: &[SwapIndex],
    ) {
    }
}

/// The forward swap: the caller's NFTs move to gldt_swap and `payout` issues their GLDT.
/// Swaps whose GLDT was not issued get their NFT back.
pub(crate) async fn forward_swap<P: ForwardPayout>(
    caller: Principal,
    args: HashSet<Nft>,
    payout: &mut P,
) -> Result<(Vec<SwapIndex>, P::Receipt), P::Error> {
    reject_anonymous_caller()
        .map_err(|e| SwapNftForTokensErrors::GeneralError(GeneralError::InvalidPrincipal(e)))?;

    if args.is_empty() {
        return Err(
            SwapNftForTokensErrors::GeneralError(GeneralError::EmptyArgs(
                "There were no NFTs provided for swap".to_string(),
            ))
            .into(),
        );
    }

    if args.len() > 100 {
        return Err(SwapNftForTokensErrors::Limit(
            "You may only swap 100 in any given request. batch your calls in batches of 100"
                .to_string(),
        )
        .into());
    }

    if balancer_running() {
        return Err(SwapNftForTokensErrors::Retry(RetryInMilliseconds(
            SECOND_IN_MS * 30,
            "the supply is currently being balanced. please try again in 15 seconds".to_string(),
        ))
        .into());
    }

    read_state(|s| s.data.swap_configs.validate_nfts(&args))
        .map_err(SwapNftForTokensErrors::from)?;

    payout.check(&args)?;

    let batched_nfts = GroupedNftsByCanister::from_nfts(args.clone());

    batched_nfts
        .validate_all_owned_by(caller)
        .await
        .into_iter()
        .find_map(|res| res.err())
        .map_or(Ok(()), |err| {
            Err(SwapNftForTokensErrors::GeneralError(
                GeneralError::UserIsNotNftOwner(err.to_string()),
            ))
        })?;

    let _nft_guards: Vec<_> = args
        .iter()
        .map(|nft| {
            GuardNft::new(nft.clone()).map_err(|e| {
                error!("NFT guard creation failed: {:?}", e);
                SwapNftForTokensErrors::GeneralError(GeneralError::AlreadyProcessing(e))
            })
        })
        .collect::<Result<Vec<_>, _>>()?;

    // the state may have changed during the ownership check
    payout.check(&args)?;

    // 1. Create swaps
    let swaps = mutate_state(|s| {
        s.data.swap_system.create_swaps_batch(
            SwapType::Forward,
            caller,
            args.clone(),
            &s.data.swap_configs,
        )
    })
    .map_err(|e| {
        error!("Failed to create swaps: {:?}", e);
        SwapNftForTokensErrors::GeneralError(e)
    })?;

    let swap_ids: Vec<candid::Nat> = swaps.keys().cloned().collect();

    let result =
        transfer_issue_and_reimburse(caller, &batched_nfts, &swaps, &swap_ids, payout).await;
    // however the steps ended, this call's swaps leave the active swaps
    mutate_state(|s| {
        s.data
            .swap_system
            .finalize_call_swaps(&swap_ids, &s.data.nft_guards)
    });
    Ok((swap_ids, result?))
}

/// Steps 2 to 4 of the forward swap, for the swaps [`forward_swap`] just created. It finalizes
/// them however this returns.
async fn transfer_issue_and_reimburse<P: ForwardPayout>(
    caller: Principal,
    batched_nfts: &GroupedNftsByCanister,
    swaps: &HashMap<SwapIndex, SwapInfo>,
    swap_ids: &[SwapIndex],
    payout: &mut P,
) -> Result<P::Receipt, P::Error> {
    let prepared_transactions =
        prepare_transactions(swaps).map_err(SwapNftForTokensErrors::from)?;
    ic_cdk::println!("prepared_transactions {:?}", prepared_transactions);

    // 2. Transfer NFTs
    let transfer_results = batched_nfts.batch_transfer_from_all(caller).await;

    let mut successful_swap_ids = Vec::new();
    let mut failed_swaps: HashMap<SwapIndex, String> = HashMap::new();

    // each swap by its own NFT's result
    for swap in swaps.values() {
        match nft_transfer_outcome(&transfer_results, &swap.nft) {
            NftTransferOutcome::Moved => {
                successful_swap_ids.push(swap.index.clone());
            }
            NftTransferOutcome::Failed(err) => {
                failed_swaps.insert(swap.index.clone(), format!("Transfer error: {:?}", err));
            }
            NftTransferOutcome::NoEntry => {
                failed_swaps.insert(
                    swap.index.clone(),
                    "NFT not found in transfer results".to_string(),
                );
            }
        }
    }

    mutate_state(|s| {
        let swap_system = &mut s.data.swap_system;

        swap_system.update_swaps_statuses(&successful_swap_ids, SwapStatus::NftTransferredFrom);

        for (swap_index, error_msg) in &failed_swaps {
            swap_system.update_swaps_status(
                swap_index,
                SwapStatus::NftTransferFromFailed(error_msg.clone()),
            );
        }
    });

    if successful_swap_ids.is_empty() {
        return Err(
            SwapNftForTokensErrors::GeneralError(GeneralError::CallError(
                "No NFT transfers succeeded; tokens are not transferred.".into(),
            ))
            .into(),
        );
    }

    // 3. Issue the GLDT
    let issued = payout.issue(caller, swaps, successful_swap_ids).await?;

    let receipt = mutate_state(|s| {
        let receipt = payout.record(s, caller, swaps, &issued.issued);
        let swap_system = &mut s.data.swap_system;
        // `Minted` also on the EVM path, where the GLDT was issued as an EVM voucher
        swap_system.update_swaps_statuses(&issued.issued, SwapStatus::Minted);
        for (swap_id, reason) in &issued.failed {
            swap_system.update_swaps_status(swap_id, SwapStatus::MintFailed(reason.clone()));
        }
        swap_system.update_swaps_statuses(swap_ids, SwapStatus::Complete);
        receipt
    });

    info!("All token transfers completed");
    let complete_swaps = read_state(|s| s.data.swap_system.filter_completed_swaps(swap_ids));

    for (swap_index, _) in complete_swaps {
        let (transaction, prepared_transaction) = prepared_transactions.get(&swap_index).unwrap();
        if let Err(e) =
            icrc3_commit_prepared_transaction(transaction.clone(), prepared_transaction.timestamp)
        {
            ic_cdk::println!("Commit failed for swap_index {:?}: {:?}", swap_index, e);
            error!(
                "icrc3_commit_prepared_transaction failed for swap_index {:?}: {:?}",
                swap_index, e
            );
        } else {
            ic_cdk::println!(
                "Successfully committed transaction for swap_index {:?}",
                swap_index
            );
            info!(
                "Successfully committed transaction for swap_index {:?}",
                swap_index
            );
        }
    }

    // 4. Reimburse failed swaps
    let swaps_to_reimburse = read_state(|s| s.data.swap_system.filter_swaps_to_reimburse(swap_ids));

    let nfts_for_reimburse: Vec<_> = swaps_to_reimburse.values().map(|s| s.nft.clone()).collect();

    let grouped_to_transfer = GroupedNftsByCanister::from_nfts(nfts_for_reimburse.clone());
    let nft_transfer_results = grouped_to_transfer.batch_transfer_all(caller).await;

    let mut nft_transfer_success: Vec<SwapIndex> = Vec::new();
    let mut nft_transfer_failed: HashMap<SwapIndex, String> = HashMap::new();

    for swap in swaps_to_reimburse.values() {
        match nft_transfer_outcome(&nft_transfer_results, &swap.nft) {
            NftTransferOutcome::Moved => {
                nft_transfer_success.push(swap.index.clone());
            }
            NftTransferOutcome::Failed(err) => {
                nft_transfer_failed
                    .insert(swap.index.clone(), format!("NFT transfer error: {:?}", err));
            }
            NftTransferOutcome::NoEntry => {
                nft_transfer_failed.insert(
                    swap.index.clone(),
                    "NFT not found in transfer results".to_string(),
                );
            }
        }
    }

    mutate_state(|s| {
        let swap_system = &mut s.data.swap_system;
        swap_system.update_swaps_statuses(&nft_transfer_success, SwapStatus::Reimbursed);
        for (idx, reason) in &nft_transfer_failed {
            swap_system.update_swaps_status(idx, SwapStatus::ReimburseFailed(reason.clone()));
        }
    });

    Ok(receipt)
}
