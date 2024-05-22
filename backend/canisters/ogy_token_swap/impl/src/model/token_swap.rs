use std::{ collections::BTreeMap, mem };

use candid::Principal;
use canister_time::timestamp_millis;
use ic_ledger_types::{ Subaccount, BlockIndex };
use ic_stable_structures::StableBTreeMap;
use ledger_utils::principal_to_legacy_account_id;
use serde::{ Deserialize, Serialize };
use ogy_token_swap_api::{
    token_swap::{ BurnFailReason, RecoverMode, SwapError, SwapStatus },
    updates::recover_stuck_transfer::Response as RecoverStuckTransferResponse,
};
use icrc_ledger_types::icrc1::transfer::BlockIndex as BlockIndexIcrc;

use crate::memory::{ get_swap_history_memory, VM };
use ogy_token_swap_api::types::token_swap::{ BlockFailReason, SwapInfo };

#[derive(Serialize, Deserialize)]
pub struct TokenSwap {
    swap: BTreeMap<BlockIndex, SwapInfo>,
    #[serde(skip, default = "init_map")]
    history: StableBTreeMap<BlockIndex, SwapInfo, VM>,
}

fn init_map() -> StableBTreeMap<BlockIndex, SwapInfo, VM> {
    let memory = get_swap_history_memory();
    StableBTreeMap::init(memory)
}

impl Default for TokenSwap {
    fn default() -> Self {
        Self { history: init_map(), swap: BTreeMap::default() }
    }
}

impl TokenSwap {
    pub fn init_swap(
        &mut self,
        block_index: BlockIndex,
        principal: Principal
    ) -> Result<Option<RecoverMode>, String> {
        match self.get_swap_info(block_index) {
            Some(entry) => {
                // only allow requests per block_index within a certain interval to avoid spamming attempts
                entry.check_timeout()?;
                // if all good continue with the check
                match &entry.status {
                    SwapStatus::Complete(block_index) =>
                        Err(format!("Swap already completed on block {block_index}.")),
                    SwapStatus::Failed(fail_reason) =>
                        match fail_reason {
                            SwapError::BlockFailed(block_fail_reason) => {
                                match block_fail_reason {
                                    BlockFailReason::NotFound => {
                                        // If the block was not found previously, maybe somebody accidentally provided
                                        // a block index that was higher than the latest one. To avoid blocking the proper
                                        // execution of this block in the future, it will be recovered here.
                                        self.swap.insert(block_index, SwapInfo::new(principal));
                                        Ok(Some(RecoverMode::RetryBlockValidation))
                                    }
                                    BlockFailReason::QueryRequestFailed => {
                                        // The previous attempt to request the info for this block failed on a higher level.
                                        // Let's try again.
                                        Ok(Some(RecoverMode::RetryBlockValidation))
                                    }
                                    BlockFailReason::ReceiverNotCorrectAccountId(subaccount) => {
                                        // If the account id was wrong in the previous block that was checked, it could be
                                        // that the wrong principal was provided as a subaccount.
                                        // Check if new subaccount (principal) was provided and retry block validation if yes.
                                        // Otherwise skip.
                                        if *subaccount != Subaccount::from(principal) {
                                            self.swap.insert(block_index, SwapInfo::new(principal));
                                            Ok(Some(RecoverMode::RetryBlockValidation))
                                        } else {
                                            Err(
                                                format!(
                                                    "Block is not a valid swap block and no new principal was provided. Not attempting a retry. Principal {principal}"
                                                )
                                            )
                                        }
                                    }
                                    BlockFailReason::SenderNotPrincipalDefaultSubaccount(
                                        account_id,
                                    ) => {
                                        // Only if the new request is made with a different principal, there is a chance
                                        // that the account_id is valid this time and we retry.
                                        if
                                            *account_id !=
                                            principal_to_legacy_account_id(principal, None)
                                        {
                                            self.swap.insert(block_index, SwapInfo::new(principal));
                                            Ok(Some(RecoverMode::RetryBlockValidation))
                                        } else {
                                            Err(
                                                "Account id in block is not the default subaccount of the requesting principal.".to_string()
                                            )
                                        }
                                    }
                                    BlockFailReason::InvalidOperation => {
                                        // If this block doesn't contain a valid transfer operation, it never will.
                                        // So there is no reason to retry checking this block.
                                        Err(
                                            "Block is not a valid swap block. The operation is not a transfer operation.".to_string()
                                        )
                                    }
                                    BlockFailReason::AmountTooSmall => {
                                        // If the token amount in the block is was too small, there is no need for a swap.
                                        // So there is no reason to retry checking this block.
                                        Err(
                                            "Amount of tokens in the block was too small. Skipping swap.".to_string()
                                        )
                                    }
                                }
                            }
                            SwapError::BurnFailed(burn_fail_reason) =>
                                match burn_fail_reason {
                                    BurnFailReason::TokenBalanceAndSwapRequestDontMatch => {
                                        // If the balance is too low, there is no direct way to recover. The user has to
                                        // withdraw and submit a new request with a new block index. So this block index
                                        // will never be recoverable
                                        Err(
                                            "Token balance in subaccount is too small to perform swap for requested block. Skipping swap.".to_string()
                                        )
                                    }
                                    | BurnFailReason::CallError(_)
                                    | BurnFailReason::TransferError(_) => {
                                        // If the burn failed because of transfer or call error, we try to recover by trying again.
                                        Ok(Some(RecoverMode::RetryBurn))
                                    }
                                }
                            SwapError::TransferFailed(_) => Ok(Some(RecoverMode::RetryTransfer)),
                            SwapError::UnexpectedError(reason) =>
                                Err(
                                    format!(
                                        "Previous execution ended with an unexpected error. Blocking any further execution as this indicates corrupted data. Reason: {reason:?}"
                                    )
                                ),
                        }
                    | SwapStatus::Init
                    | SwapStatus::BlockRequest(_)
                    | SwapStatus::BlockValid
                    | SwapStatus::BurnRequest(_)
                    | SwapStatus::BurnSuccess
                    | SwapStatus::TransferRequest(_) => Err("Swap already running.".to_string()),
                }
            }
            None => {
                self.swap.insert(block_index, SwapInfo::new(principal));
                Ok(None)
            }
        }
    }

    pub fn recover_stuck_transfer(
        &mut self,
        block_index: BlockIndex
    ) -> Result<(), RecoverStuckTransferResponse> {
        match self.swap.get_mut(&block_index) {
            Some(entry) =>
                match entry.status.clone() {
                    // If the swap status is in state TransferRequest, reset state to before transfer request and an attempt to recover can be made
                    SwapStatus::TransferRequest(_) => {
                        entry.status = SwapStatus::BurnSuccess;
                        Ok(())
                    }
                    // In all other cases, there is no legitimate reason to retry to recover
                    val => Err(RecoverStuckTransferResponse::SwapIsNotStuckInTransfer(val.clone())),
                }
            // If not entry is found for this block_index, it's not a valid request
            None => Err(RecoverStuckTransferResponse::NoSwapRequestFound),
        }
    }

    pub fn check_timeout(&mut self, block_index: BlockIndex) -> Result<(), String> {
        match self.swap.get_mut(&block_index) {
            Some(entry) => entry.check_timeout(),
            None => Err(format!("No entry found for block index {}", block_index)),
        }
    }

    pub fn update_last_request_time(&mut self, block_index: BlockIndex) -> Result<u64, String> {
        match self.swap.get_mut(&block_index) {
            Some(entry) => {
                let now = timestamp_millis();
                entry.last_request = now;
                Ok(now)
            }
            None => Err(format!("No entry found for block index {}", block_index)),
        }
    }

    pub fn get_swap_info(&self, block_index: BlockIndex) -> Option<SwapInfo> {
        let swap_info_incomplete = self.swap.get(&block_index).cloned();
        let swap_info_completed = self.history.get(&block_index);
        swap_info_incomplete.or(swap_info_completed)
    }

    pub fn update_status(&mut self, block_index: BlockIndex, status: SwapStatus) {
        if let Some(entry) = self.swap.get_mut(&block_index) {
            entry.status = status;
        }; // other case is not possible because it was initialised before
    }

    pub fn set_amount(&mut self, block_index: BlockIndex, amount: u64) {
        if let Some(entry) = self.swap.get_mut(&block_index) {
            entry.amount = amount;
        } // other case is not possible because it was initialised before
    }
    pub fn get_amount(&self, block_index: BlockIndex) -> u64 {
        match self.swap.get(&block_index) {
            Some(swap_info) => swap_info.amount,
            None => 0, // this is not possible because it was initialised before
        }
    }
    pub fn get_principal(&self, block_index: BlockIndex) -> Result<Principal, String> {
        match self.swap.get(&block_index) {
            Some(swap_info) => Ok(swap_info.principal),
            None => Err(format!("No principal entry not found for block index {block_index}.")), // this is not possible because it was initialised before but validating here in any case
        }
    }
    pub fn set_burn_block_index(&mut self, block_index: BlockIndex, burn_block_index: BlockIndex) {
        if let Some(entry) = self.swap.get_mut(&block_index) {
            entry.burn_block_index = Some(burn_block_index);
        } // other case is not possible because it was initialised before
    }
    pub fn set_swap_block_index(
        &mut self,
        block_index: BlockIndex,
        swap_block_index: BlockIndexIcrc
    ) {
        if let Some(entry) = self.swap.get_mut(&block_index) {
            entry.token_swap_block_index = Some(swap_block_index);
        } // other case is not possible because it was initialised before
    }

    pub fn archive_swap(&mut self, block_index: BlockIndex) -> Result<(), String> {
        let swap_info = self.swap.get(&block_index);
        match swap_info {
            Some(swap) => {
                self.history.insert(block_index, swap.clone());
                self.swap.remove(&block_index);
                Ok(())
            }
            None =>
                Err(
                    format!(
                        "can't archive {block_index} because it doesn't exist in swap heap memory"
                    )
                ),
        }
    }
    /// should only be used for integration testing
    pub fn _restore_archived_swap(&mut self, block_index: BlockIndex) -> Result<(), String> {
        let swap_info = self.history.get(&block_index);
        match swap_info {
            Some(swap) => {
                self.history.remove(&block_index);
                self.swap.insert(block_index, swap.clone());
                Ok(())
            }
            None =>
                Err(
                    format!(
                        "can't archive {block_index} because it doesn't exist in swap heap memory"
                    )
                ),
        }
    }

    pub fn is_capacity_full(&self) -> bool {
        let block_index_size = mem::size_of::<BlockIndex>();
        let swap_info_size = mem::size_of::<SwapInfo>();
        let entry_size = block_index_size + swap_info_size;
        let total_size = entry_size * self.swap.len();

        const ONE_GB: usize = 1 * 1024 * 1024 * 1024; // 1 GB in bytes

        total_size >= ONE_GB
    }
}
