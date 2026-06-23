use crate::memory::get_payment_round_history_memory_v0;
use ic_stable_structures::StableBTreeMap;
use serde::{Deserialize, Serialize};
use sns_governance_canister::types::NeuronId;
use sns_rewards_api_canister::payment_round::PaymentRoundV0;
use sns_rewards_api_canister::payment_round::{PaymentRound, PaymentStatus};
use std::collections::BTreeMap;
use tracing::debug;
use types::TokenSymbol;
use types::TokenSymbolV0;

use crate::memory::{get_payment_round_history_memory, VM};

#[derive(Serialize, Deserialize)]
pub struct PaymentProcessor {
    #[serde(skip, default = "init_map_v0")]
    pub round_history_v0: StableBTreeMap<(TokenSymbolV0, u16), PaymentRoundV0, VM>,
    /// Holds only PaymentRounds that are FULLY completed.
    #[serde(skip, default = "init_map")]
    pub round_history: StableBTreeMap<(TokenSymbol, u16), PaymentRound, VM>,
    /// Holds active PaymentRounds that are being processed
    pub active_rounds: BTreeMap<TokenSymbol, PaymentRound>,
    /// Holds active 5y PaymentRounds that are being processed
    pub active_rounds_5y: BTreeMap<TokenSymbol, PaymentRound>,
    /// The next unique ID to be assigned to a payment round
    pub next_key: u16,
}

fn init_map_v0() -> StableBTreeMap<(TokenSymbolV0, u16), PaymentRoundV0, VM> {
    let memory = get_payment_round_history_memory_v0();
    StableBTreeMap::init(memory)
}

fn init_map() -> StableBTreeMap<(TokenSymbol, u16), PaymentRound, VM> {
    let memory = get_payment_round_history_memory();
    StableBTreeMap::init(memory)
}

impl Default for PaymentProcessor {
    fn default() -> Self {
        Self {
            round_history_v0: init_map_v0(),
            round_history: init_map(),
            active_rounds: BTreeMap::new(),
            active_rounds_5y: BTreeMap::new(),
            next_key: 1,
        }
    }
}

#[derive(Clone, Copy, Debug)]
pub enum NeuronFlow {
    Regular,
    FiveYear,
}

impl PaymentProcessor {
    fn rounds_mut(&mut self, flow: NeuronFlow) -> &mut BTreeMap<TokenSymbol, PaymentRound> {
        match flow {
            NeuronFlow::Regular => &mut self.active_rounds,
            NeuronFlow::FiveYear => &mut self.active_rounds_5y,
        }
    }

    fn rounds(&self, flow: NeuronFlow) -> &BTreeMap<TokenSymbol, PaymentRound> {
        match flow {
            NeuronFlow::Regular => &self.active_rounds,
            NeuronFlow::FiveYear => &self.active_rounds_5y,
        }
    }

    /// Increments the internal key counter and handles the u16 wrap-around logic.
    pub fn increment_next_key(&mut self) {
        if self.next_key == u16::MAX {
            self.next_key = 1;
        } else {
            self.next_key += 1;
        }
    }

    pub fn add_active_payment_round(&mut self, flow: NeuronFlow, round: PaymentRound) {
        // Insert into the appropriate active map
        self.rounds_mut(flow).insert(round.token, round);

        // // Increment the key for the next round
        // self.increment_next_key();
    }

    pub fn get_active_rounds(&self, flow: NeuronFlow) -> Vec<PaymentRound> {
        self.rounds(flow).values().cloned().collect()
    }

    pub fn set_active_payment_status(
        &mut self,
        flow: NeuronFlow,
        round_token: &TokenSymbol,
        neuron_id: &NeuronId,
        new_status: PaymentStatus,
    ) {
        if let Some(round) = self.rounds_mut(flow).get_mut(round_token) {
            if let Some(payment) = round.payments.get_mut(neuron_id) {
                payment.1 = new_status;
            } else {
                debug!(
                    "ERROR - ROUND ID : {} & TOKEN :{:?} - set_active_payment_status failed - can't find neuron id {:?}",
                    round.id,
                    round_token,
                    neuron_id
                );
            }
        } else {
            debug!(
                "ERROR - set_active_payment_status failed - can't find round {:?} in active_rounds",
                round_token
            );
        }
    }

    pub fn get_payment_round_history(
        &self,
        token: TokenSymbol,
        id: u16,
    ) -> Vec<(u16, PaymentRound)> {
        let rounds = self
            .round_history
            .iter()
            .filter(|entry| entry.key().1 == id && entry.value().token == token)
            .map(|entry| (entry.key().1, entry.value().clone()))
            .collect();

        rounds
    }

    pub fn get_payment_round_history_v0(
        &self,
        token: TokenSymbolV0,
        id: u16,
    ) -> Vec<(u16, PaymentRoundV0)> {
        let rounds = self
            .round_history_v0
            .iter()
            .filter(|entry| entry.key().1 == id && entry.value().token == token)
            .map(|entry| (entry.key().1, entry.value().clone()))
            .collect();

        rounds
    }

    pub fn get_all_round_history(&self) -> Vec<(u16, PaymentRound)> {
        let rounds = self
            .round_history
            .iter()
            .map(|entry| (entry.key().1, entry.value().clone()))
            .collect();

        rounds
    }

    pub fn add_to_history(&mut self, payment_round: PaymentRound) {
        // NOTE: Ensure that if we add something to history, the next_key stays ahead of the ID we just added
        if payment_round.id >= self.next_key {
            self.next_key = if payment_round.id == u16::MAX {
                1
            } else {
                payment_round.id + 1
            };
        }

        self.round_history
            .insert((payment_round.token, payment_round.id), payment_round);
    }

    pub fn delete_active_round(&mut self, flow: NeuronFlow, round_token: TokenSymbol) {
        self.rounds_mut(flow).remove_entry(&round_token);
    }

    pub fn set_payment_round_retry_count(
        &mut self,
        flow: NeuronFlow,
        token: &TokenSymbol,
        attempt: u8,
    ) {
        if let Some(round) = self.rounds_mut(flow).get_mut(token) {
            round.retries = attempt;
        } else {
            debug!(
                "ERROR - set_payment_round_retry_count - can't find active round for token {:?}",
                token
            );
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::state::{init_state, mutate_state, read_state, RuntimeState};
    use candid::{Nat, Principal};
    use std::collections::BTreeMap;
    use types::TokenSymbol;

    fn init_runtime_state() {
        init_state(RuntimeState::default());
    }

    fn mock_round(id: u16, token: TokenSymbol) -> PaymentRound {
        PaymentRound {
            id,
            token,
            round_funds_total: Nat::from(100u64),
            tokens_to_distribute: Nat::from(100u64),
            fees: Nat::from(10u64),
            ledger_id: Principal::anonymous(),
            date_initialized: 123456789,
            total_neuron_maturity: 1000,
            payments: BTreeMap::default(),
            retries: 0,
        }
    }

    // --- Tests ---

    #[test]
    fn test_next_key_increments_on_add_to_history() {
        init_runtime_state();

        // 1. Initial state check
        read_state(|s| assert_eq!(s.data.payment_processor.next_key, 1));

        // 2. Add round 1 (ICP). next_key should become 2.
        mutate_state(|s| {
            s.data
                .payment_processor
                .add_to_history(mock_round(1, TokenSymbol::ICP));
        });
        read_state(|s| assert_eq!(s.data.payment_processor.next_key, 2));

        // 3. Add round 1 again (for a different token OGY).
        // Logic in add_to_history says if id >= next_key, update.
        // Here 1 is not >= 2, so next_key remains 2.
        mutate_state(|s| {
            s.data
                .payment_processor
                .add_to_history(mock_round(1, TokenSymbol::OGY));
        });
        read_state(|s| assert_eq!(s.data.payment_processor.next_key, 2));

        // 4. Add round 2 (ICP). next_key should become 3.
        mutate_state(|s| {
            s.data
                .payment_processor
                .add_to_history(mock_round(2, TokenSymbol::ICP));
        });
        read_state(|s| assert_eq!(s.data.payment_processor.next_key, 3));
    }

    #[test]
    fn test_next_key_jumps_on_skipped_ids() {
        init_runtime_state();

        // If we manually insert a round with a much higher ID,
        // next_key should jump to preserve uniqueness for future rounds.
        mutate_state(|s| {
            s.data
                .payment_processor
                .add_to_history(mock_round(10, TokenSymbol::ICP));
        });

        read_state(|s| {
            assert_eq!(s.data.payment_processor.next_key, 11);
        });
    }

    #[test]
    fn test_next_key_wrap_around() {
        init_runtime_state();

        // Simulate reaching the maximum value for u16
        mutate_state(|s| {
            s.data
                .payment_processor
                .add_to_history(mock_round(u16::MAX, TokenSymbol::ICP));
        });

        read_state(|s| {
            // According to the logic: if id == u16::MAX { 1 } else { id + 1 }
            assert_eq!(s.data.payment_processor.next_key, 1);
        });
    }

    #[test]
    fn test_flow_selection() {
        let mut processor = PaymentProcessor::default();
        let icp = TokenSymbol::ICP;

        // Ensure regular and 5y flows are separate
        processor.add_active_payment_round(NeuronFlow::Regular, mock_round(1, icp.clone()));
        processor.add_active_payment_round(NeuronFlow::FiveYear, mock_round(1, icp.clone()));

        assert_eq!(processor.active_rounds.len(), 1);
        assert_eq!(processor.active_rounds_5y.len(), 1);
    }
}
