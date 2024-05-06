use candid::Principal;
use rand::{ RngCore, Rng, thread_rng };

pub fn random_principal() -> Principal {
    let mut bytes = [0u8; 29];
    thread_rng().fill_bytes(&mut bytes);
    Principal::from_slice(&bytes)
}
pub fn random_amount(min: u64, max: u64) -> u64 {
    let mut rng = rand::thread_rng();
    rng.gen_range(min..max)
}
