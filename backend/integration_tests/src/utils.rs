use candid::Principal;
use pocket_ic::PocketIc;
use rand::{ RngCore, Rng, thread_rng };
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
