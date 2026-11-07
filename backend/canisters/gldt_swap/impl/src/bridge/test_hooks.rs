//! Integration build only. A PocketIC test can make the canister lose the answer to its next
//! mint or burn on the GLDT ledger after the ledger ran it, as a lost reply or a trap after the
//! await would. The retry then sends the same memo and `created_at_time`, and the ledger must
//! answer `Duplicate`.

use candid::{CandidType, Deserialize};
use std::cell::Cell;

/// Which ledger call loses its answer.
#[derive(CandidType, Deserialize, Clone, Copy, Debug, PartialEq, Eq)]
pub enum LedgerCall {
    /// The next inbound `icrc1_transfer` mint.
    Mint,
    /// The next outbound `icrc2_transfer_from` burn.
    Burn,
}

thread_local! {
    static LOSE_NEXT_MINT_REPLY: Cell<bool> = const { Cell::new(false) };
    static LOSE_NEXT_BURN_REPLY: Cell<bool> = const { Cell::new(false) };
}

fn flag(call: LedgerCall) -> &'static std::thread::LocalKey<Cell<bool>> {
    match call {
        LedgerCall::Mint => &LOSE_NEXT_MINT_REPLY,
        LedgerCall::Burn => &LOSE_NEXT_BURN_REPLY,
    }
}

/// The next `call` runs on the ledger, but the canister drops its answer.
pub fn lose_next_reply(call: LedgerCall) {
    flag(call).with(|f| f.set(true));
}

/// True once after [lose_next_reply] for `call`.
pub fn take_lost_reply(call: LedgerCall) -> bool {
    flag(call).with(|f| f.replace(false))
}
