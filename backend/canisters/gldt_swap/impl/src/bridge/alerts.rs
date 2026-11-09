//! Bridge health: failed ticks in a row, a cursor that stopped moving, and a mint
//! queue held by the supply guard or the `bridged_out` cap.
//!
//! An alert is raised once when a condition starts, not on every tick, so the ring of 100
//! alerts keeps older ones such as `NeedsManualCheck`.

use crate::bridge::inbound::evm_side;
use crate::bridge::state::{BridgeState, ChainState, MintHold, Severity};
use gldt_swap_common::bridge::EvmChain;

/// A chain alerts when this many ticks in a row fail (15 minutes at one tick every 3).
pub const FAILED_TICKS_ALERT: u32 = 5;

/// A chain alerts when its cursor has not moved for this long while the head moved past it.
pub const STALE_CURSOR_NANOS: u64 = 30 * 60 * 1_000_000_000;

/// Errors are kept to this many bytes in `last_error` and in alerts.
pub const MAX_ERROR_LEN: usize = 300;

/// Below this balance the bridge alerts that cycles run low. At about 1.7 T cycles a day for
/// scraping, it is about a day left.
pub const LOW_CYCLES: u128 = 2_000_000_000_000;

/// Alerts once when the balance drops below [LOW_CYCLES], and again only after it was above.
pub fn track_cycles(state: &mut BridgeState, cycles: u128, now: u64) {
    let low = cycles < LOW_CYCLES;
    if low && !state.cycles_low {
        state.push_alert(
            now,
            Severity::Critical,
            format!("cycles run low: {cycles} left, below {LOW_CYCLES}"),
        );
    }
    state.cycles_low = low;
}

/// Counts a failed tick and keeps its error. Alerts when the count reaches
/// [FAILED_TICKS_ALERT]. Nothing else changes.
pub fn record_tick_failure(state: &mut BridgeState, chain: EvmChain, err: &str, now: u64) {
    let err = short(err);
    let Some(c) = state.chain_state_mut(chain) else {
        return;
    };
    c.failed_ticks = c.failed_ticks.saturating_add(1);
    c.last_error = Some(err.clone());
    if c.failed_ticks == FAILED_TICKS_ALERT {
        state.push_alert(
            now,
            Severity::Warning,
            format!(
                "{chain:?}: {FAILED_TICKS_ALERT} scrape ticks failed in a row, last error: {err}"
            ),
        );
    }
}

/// A tick that finished: the failure count starts again.
pub fn record_tick_ok(state: &mut BridgeState, chain: EvmChain, now: u64) {
    if let Some(c) = state.chain_state_mut(chain) {
        c.failed_ticks = 0;
        c.last_ok_at = Some(now);
    }
}

/// Notes the time when the cursor `(last_scraped_block, next_burn_id)` moved away from `before`.
pub fn track_cursor(chain: &mut ChainState, before: (u64, u64), now: u64) {
    if (chain.last_scraped_block, chain.next_burn_id) != before {
        chain.cursor_moved_at = Some(now);
        chain.stale_alerted = false;
    }
}

/// Alerts once when the cursor has not moved for [STALE_CURSOR_NANOS] although
/// `confirmed_head`, a block the chain has confirmed, is past it.
pub fn check_stale_cursor(state: &mut BridgeState, chain: EvmChain, confirmed_head: u64, now: u64) {
    let Some(c) = state.chain_state_mut(chain) else {
        return;
    };
    let Some(moved_at) = c.cursor_moved_at else {
        return;
    };
    let stale =
        confirmed_head > c.last_scraped_block && now.saturating_sub(moved_at) >= STALE_CURSOR_NANOS;
    if !stale || c.stale_alerted {
        return;
    }
    c.stale_alerted = true;
    let msg = format!(
        "{chain:?}: the cursor has not moved for 30 minutes (block {}, next burn id {}) while block {confirmed_head} is confirmed",
        c.last_scraped_block, c.next_burn_id
    );
    state.push_alert(now, Severity::Warning, msg);
}

/// Alerts once when the mint queue starts to wait on `hold`, or waits on another check than
/// before. `None` (a mint went out, or nothing is queued) ends the hold. A guard hold is a
/// Warning, since a LayerZero transfer can count on both chains for a moment; a `bridged_out` cap
/// hold is Critical, since no honest burn is above `bridged_out`.
pub fn track_mint_hold(state: &mut BridgeState, hold: Option<MintHold>, now: u64) {
    if state.mint_hold == hold {
        return;
    }
    state.mint_hold = hold;
    let (severity, msg) = match hold {
        None => return,
        Some(MintHold::Guard) => (
            Severity::Warning,
            format!(
                "minting waits: the supply guard holds, supply readings plus unminted burns ({} e8s) are above bridged_out ({} e8s)",
                evm_side(state, state.unminted_e8s),
                state.bridged_out
            ),
        ),
        Some(MintHold::OverBridgedOut) => (
            Severity::Critical,
            format!(
                "minting waits: the next burn is above bridged_out ({} e8s)",
                state.bridged_out
            ),
        ),
    };
    state.push_alert(now, severity, msg);
}

/// `err`, cut to at most [MAX_ERROR_LEN] bytes on a character boundary.
pub fn short(err: &str) -> String {
    if err.len() <= MAX_ERROR_LEN {
        return err.to_string();
    }
    let mut end = MAX_ERROR_LEN;
    while !err.is_char_boundary(end) {
        end -= 1;
    }
    format!("{}...", &err[..end])
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::bridge::config::test_fixtures::configured_state;

    const MIN: u64 = 60 * 1_000_000_000;

    fn chain(state: &BridgeState, chain: EvmChain) -> ChainState {
        state.chain_state(chain).cloned().unwrap()
    }

    #[test]
    fn low_cycles_alert_once_until_the_balance_recovers() {
        let mut state = configured_state();
        track_cycles(&mut state, LOW_CYCLES, 1);
        assert!(state.alerts.is_empty());

        // below the line: one Critical alert, however often it is checked
        track_cycles(&mut state, LOW_CYCLES - 1, 2);
        track_cycles(&mut state, LOW_CYCLES / 2, 3);
        assert_eq!(state.alerts.len(), 1);
        let alert = state.alerts.back().unwrap();
        assert_eq!(alert.severity, Severity::Critical);
        assert_eq!(alert.time, 2);
        assert!(
            alert.message.contains("cycles run low"),
            "{}",
            alert.message
        );

        // topped up, then low again: a new alert
        track_cycles(&mut state, 3 * LOW_CYCLES, 4);
        assert!(!state.cycles_low);
        track_cycles(&mut state, 1, 5);
        assert_eq!(state.alerts.len(), 2);
    }

    #[test]
    fn failed_ticks_alert_once_at_five_in_a_row() {
        let mut state = configured_state();
        for t in 1..=4 {
            record_tick_failure(&mut state, EvmChain::Base, "providers disagree", t);
        }
        assert!(state.alerts.is_empty());
        assert_eq!(chain(&state, EvmChain::Base).failed_ticks, 4);
        assert_eq!(
            chain(&state, EvmChain::Base).last_error.as_deref(),
            Some("providers disagree")
        );

        record_tick_failure(&mut state, EvmChain::Base, "providers disagree", 5);
        assert_eq!(state.alerts.len(), 1);
        let alert = state.alerts.back().unwrap();
        assert_eq!(alert.severity, Severity::Warning);
        assert_eq!(alert.time, 5);
        assert!(alert.message.contains("Base"), "{}", alert.message);
        assert!(alert.message.contains("5 "), "{}", alert.message);
        assert!(alert.message.contains("providers disagree"));

        // still failing: no new alert
        record_tick_failure(&mut state, EvmChain::Base, "providers disagree", 6);
        assert_eq!(state.alerts.len(), 1);
        assert_eq!(chain(&state, EvmChain::Base).failed_ticks, 6);

        record_tick_ok(&mut state, EvmChain::Base, 7);
        assert_eq!(chain(&state, EvmChain::Base).failed_ticks, 0);
        assert_eq!(chain(&state, EvmChain::Base).last_ok_at, Some(7));

        // a new streak of five alerts again
        for t in 8..=12 {
            record_tick_failure(&mut state, EvmChain::Base, "timeout", t);
        }
        assert_eq!(state.alerts.len(), 2);

        // the other chain is untouched
        assert_eq!(chain(&state, EvmChain::Ethereum), ChainState::default());
    }

    #[test]
    fn long_errors_are_cut_short() {
        let mut state = configured_state();
        record_tick_failure(&mut state, EvmChain::Base, &"é".repeat(5_000), 1);
        let error = chain(&state, EvmChain::Base).last_error.unwrap();
        assert!(error.len() <= MAX_ERROR_LEN + 3, "{}", error.len());
        assert!(error.starts_with("éé"));
        assert!(error.ends_with("..."));
    }

    #[test]
    fn stale_cursor_alerts_once_after_30_minutes_while_the_head_moved() {
        let mut state = configured_state();
        // the cursor never moved yet (before the first tick): nothing to compare
        check_stale_cursor(&mut state, EvmChain::Base, 10_000, 100 * MIN);
        assert!(state.alerts.is_empty());

        let before = {
            let c = state.chain_state_mut(EvmChain::Base).unwrap();
            let before = (c.last_scraped_block, c.next_burn_id);
            c.last_scraped_block = 500;
            track_cursor(c, before, 0);
            (c.last_scraped_block, c.next_burn_id)
        };
        assert_eq!(chain(&state, EvmChain::Base).cursor_moved_at, Some(0));

        // under 30 minutes
        check_stale_cursor(&mut state, EvmChain::Base, 900, 29 * MIN);
        // 30 minutes, but the confirmed head is not past the cursor
        check_stale_cursor(&mut state, EvmChain::Base, 500, 31 * MIN);
        assert!(state.alerts.is_empty());

        // 30 minutes and the head moved past the cursor
        check_stale_cursor(&mut state, EvmChain::Base, 501, 30 * MIN);
        assert_eq!(state.alerts.len(), 1);
        let alert = state.alerts.back().unwrap();
        assert_eq!(alert.severity, Severity::Warning);
        assert!(alert.message.contains("Base"), "{}", alert.message);
        assert!(alert.message.contains("30 minutes"), "{}", alert.message);

        // once per stale period
        check_stale_cursor(&mut state, EvmChain::Base, 700, 45 * MIN);
        assert_eq!(state.alerts.len(), 1);

        // the cursor moves: a later stale period alerts again
        {
            let c = state.chain_state_mut(EvmChain::Base).unwrap();
            c.next_burn_id = 3;
            track_cursor(c, before, 46 * MIN);
        }
        check_stale_cursor(&mut state, EvmChain::Base, 700, 60 * MIN);
        assert_eq!(state.alerts.len(), 1);
        check_stale_cursor(&mut state, EvmChain::Base, 700, 76 * MIN);
        assert_eq!(state.alerts.len(), 2);
    }

    #[test]
    fn track_cursor_ignores_a_cursor_that_did_not_move() {
        let mut chain = ChainState {
            cursor_moved_at: Some(5),
            stale_alerted: true,
            last_scraped_block: 9,
            next_burn_id: 2,
            ..Default::default()
        };
        track_cursor(&mut chain, (9, 2), 99);
        assert_eq!(chain.cursor_moved_at, Some(5));
        assert!(chain.stale_alerted);
        track_cursor(&mut chain, (8, 2), 99);
        assert_eq!(chain.cursor_moved_at, Some(99));
        assert!(!chain.stale_alerted);
    }
}
