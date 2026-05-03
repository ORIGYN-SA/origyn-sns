use candid::Principal;
use pocket_ic::PocketIc;
use rand::{thread_rng, Rng, RngCore};
use std::{ops::Range, time::Duration};
use types::Cycles;

pub fn random_principal() -> Principal {
    let mut bytes = [0u8; 29];
    thread_rng().fill_bytes(&mut bytes);
    Principal::from_slice(&bytes)
}
pub fn random_subaccount() -> [u8; 32] {
    let mut subaccount = [0u8; 32];
    let mut rng = rand::thread_rng();
    rng.fill(&mut subaccount);
    subaccount
}
pub fn random_amount(min: u64, max: u64) -> u64 {
    let mut rng = rand::thread_rng();
    rng.gen_range(min..max)
}

pub const T: Cycles = 1_000_000_000_000;

pub fn tick_n_blocks(pic: &PocketIc, times: u32) {
    for _ in 0..times {
        pic.tick();
    }
}

use bity_ic_canister_time::DAY_IN_MS;
use types::TimestampMillis;
pub fn is_interval_more_than_7_days(
    previous_time: TimestampMillis,
    now_time: TimestampMillis,
) -> bool {
    // convert the milliseconds to the number of days since UNIX Epoch.
    // integer division means partial days will be truncated down or effectively rounded down. e.g 245.5 becomes 245
    let previous_in_days = previous_time / DAY_IN_MS;
    let current_in_days = now_time / DAY_IN_MS;
    // never allow distributions to happen twice i.e if the last run distribution in days since UNIX epoch is the same as the current time in days since the last UNIX Epoch then return early.
    current_in_days >= previous_in_days + 7
}

// Using 'advance_time' in live mode breaks certificate checking, so we have to wait
// for the time to pass naturally.
fn progress_pocket_ic(pocket_ic: &PocketIc, seconds: u64) {
    if pocket_ic.url().is_some() {
        std::thread::sleep(Duration::from_secs(seconds));
    } else {
        pocket_ic.tick();
        pocket_ic.advance_time(Duration::from_secs(seconds));
    }
}

pub fn await_with_timeout_sync<T, F>(
    pocket_ic: &PocketIc,
    expected_event_interval_seconds: Range<u64>,
    observe: F,
    expected: &T,
) -> Result<(), String>
where
    T: std::cmp::PartialEq + std::fmt::Debug,
    F: Fn(&PocketIc) -> T, // Removed the 'a lifetime here
{
    // ... rest of the code remains the same ...
    assert!(expected_event_interval_seconds.start < expected_event_interval_seconds.end);
    let timeout_seconds =
        expected_event_interval_seconds.end - expected_event_interval_seconds.start;

    progress_pocket_ic(pocket_ic, expected_event_interval_seconds.start);

    let mut counter = 0;
    let num_ticks = timeout_seconds.min(500);
    let seconds_per_tick = (timeout_seconds as f64 / num_ticks as f64).ceil() as u64;

    loop {
        progress_pocket_ic(pocket_ic, seconds_per_tick);

        let observed = observe(pocket_ic);
        if observed == *expected {
            return Ok(());
        }

        counter += 1;
        if counter > num_ticks {
            return Err(format!(
                "Observed state: {observed:?}\n!= Expected state {expected:?}\nafter {timeout_seconds} seconds ({counter} ticks of {seconds_per_tick}s each)",
            ));
        }
    }
}
