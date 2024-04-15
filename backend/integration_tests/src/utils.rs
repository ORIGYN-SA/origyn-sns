use candid::Principal;
use rand::{ RngCore, thread_rng };

pub fn random_principal() -> Principal {
    let mut bytes = [0u8; 8];
    thread_rng().fill_bytes(&mut bytes);
    Principal::from_slice(&bytes)
}
