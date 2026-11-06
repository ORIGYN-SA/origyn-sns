//! The bridge's four stable maps, on memory ids 1 to 4. They live outside the heap
//! state that `pre_upgrade` serializes, so bridge history doesn't slow upgrades.
//!
//! Values are MessagePack encoded with named fields (`bity_ic_serializer`), like `Data`,
//! because U256 has no Candid type. Keys use the fixed size encodings of
//! `ic-stable-structures`: an `InboundKey` is 36 bytes (chain id, token, burn id),
//! ordered by chain id, then token, then burn id.

use crate::bridge::state::{Deployment, InboundRecord, SignedAdminAction};
use crate::memory::{get_bridge_memory, VM};
pub use gldt_swap_common::bridge::OutboundTransfer;
use ic_stable_structures::storable::Bound;
use ic_stable_structures::{StableBTreeMap, Storable};
use serde::{de::DeserializeOwned, Serialize};
use std::borrow::Cow;
use std::cell::RefCell;

/// `(deployment, burn_id)`: the key of an inbound transfer.
pub type InboundKey = (Deployment, u64);

pub const OUTBOUND_MEMORY: u8 = 1;
pub const INBOUND_MEMORY: u8 = 2;
pub const QUEUE_MEMORY: u8 = 3;
pub const ADMIN_ACTIONS_MEMORY: u8 = 4;

/// Out id to transfer.
pub type OutboundMap = StableBTreeMap<u64, OutboundTransfer, VM>;
/// Inbound key to record, every burn ever seen.
pub type InboundMap = StableBTreeMap<InboundKey, InboundRecord, VM>;
/// Queue sequence number to the inbound record waiting to be minted.
pub type QueueMap = StableBTreeMap<u64, InboundKey, VM>;
/// Admin action id (the `execute` nonce) to the signed action.
pub type AdminActionsMap = StableBTreeMap<u64, SignedAdminAction, VM>;

thread_local! {
    static OUTBOUND: RefCell<OutboundMap> =
        RefCell::new(StableBTreeMap::init(get_bridge_memory(OUTBOUND_MEMORY)));
    static INBOUND: RefCell<InboundMap> =
        RefCell::new(StableBTreeMap::init(get_bridge_memory(INBOUND_MEMORY)));
    static QUEUE: RefCell<QueueMap> =
        RefCell::new(StableBTreeMap::init(get_bridge_memory(QUEUE_MEMORY)));
    static ADMIN_ACTIONS: RefCell<AdminActionsMap> =
        RefCell::new(StableBTreeMap::init(get_bridge_memory(ADMIN_ACTIONS_MEMORY)));
}

pub fn with_outbound<R>(f: impl FnOnce(&mut OutboundMap) -> R) -> R {
    OUTBOUND.with_borrow_mut(f)
}

pub fn with_inbound<R>(f: impl FnOnce(&mut InboundMap) -> R) -> R {
    INBOUND.with_borrow_mut(f)
}

pub fn with_queue<R>(f: impl FnOnce(&mut QueueMap) -> R) -> R {
    QUEUE.with_borrow_mut(f)
}

pub fn with_admin_actions<R>(f: impl FnOnce(&mut AdminActionsMap) -> R) -> R {
    ADMIN_ACTIONS.with_borrow_mut(f)
}

fn encode<T: Serialize>(value: &T) -> Vec<u8> {
    let mut buf = Vec::new();
    bity_ic_serializer::serialize(value, &mut buf).expect("failed to encode a bridge record");
    buf
}

fn decode<T: DeserializeOwned>(bytes: &[u8]) -> T {
    bity_ic_serializer::deserialize(bytes).expect("failed to decode a bridge record")
}

impl Storable for InboundRecord {
    fn to_bytes(&self) -> Cow<'_, [u8]> {
        Cow::Owned(encode(self))
    }

    fn into_bytes(self) -> Vec<u8> {
        encode(&self)
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        decode(&bytes)
    }

    const BOUND: Bound = Bound::Unbounded;
}

impl Storable for SignedAdminAction {
    fn to_bytes(&self) -> Cow<'_, [u8]> {
        Cow::Owned(encode(self))
    }

    fn into_bytes(self) -> Vec<u8> {
        encode(&self)
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        decode(&bytes)
    }

    const BOUND: Bound = Bound::Unbounded;
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::bridge::state::{BridgeState, ChainState, SupplyReading, Window};
    use alloy_primitives::U256;
    use candid::{Nat, Principal};
    use gldt_swap_common::bridge::{EvmChain, InboundStatus, OutboundStatus};
    use ic_stable_structures::storable::{Bound, Storable};
    use icrc_ledger_types::icrc1::account::Account;

    fn inbound(chain: EvmChain, burn_id: u64, amount: U256) -> InboundRecord {
        InboundRecord {
            chain,
            token: "0x00000000000000000000000000000000000B1D6E".to_string(),
            burn_id,
            tx_hash: format!("0x{}", "cd".repeat(32)),
            log_index: 1,
            block_number: 10,
            evm_from: "0x0A82D20142d067C8AF32f48664bDDfb65EcAE507".to_string(),
            to: Account {
                owner: Principal::from_slice(&[9; 29]),
                subaccount: None,
            },
            amount,
            discovered_at: 2,
            status: InboundStatus::Queued,
        }
    }

    #[test]
    fn u256_state_roundtrips_through_serializer() {
        let mut state = BridgeState {
            bridged_out: u128::MAX,
            out_pending: u128::MAX - 1,
            ..Default::default()
        };
        state.chains.insert(
            (1, [0xab; 20]),
            ChainState {
                start_block: Some(10),
                last_scraped_block: 20,
                next_burn_id: 3,
                window: Some(Window {
                    to_block: 30,
                    end_burn_id: 7,
                    total_supply: U256::MAX,
                }),
                supply: Some(SupplyReading {
                    block: 20,
                    total_supply: U256::MAX,
                }),
                failed_ticks: 2,
                last_ok_at: Some(5),
                last_error: Some("timeout".to_string()),
                stopped: None,
            },
        );
        state
            .chains
            .insert((8453, [0xcd; 20]), ChainState::default());

        let mut buf = Vec::new();
        bity_ic_serializer::serialize(&state, &mut buf).unwrap();
        let back: BridgeState = bity_ic_serializer::deserialize(buf.as_slice()).unwrap();
        assert_eq!(back, state);
        let window = back.chains[&(1, [0xab; 20])].window.clone().unwrap();
        assert_eq!(window.total_supply, U256::MAX);

        let key: InboundKey = ((8453, [0xcd; 20]), 7);
        let record = inbound(EvmChain::Base, 7, U256::MAX);
        with_inbound(|m| m.insert(key, record.clone()));
        assert_eq!(with_inbound(|m| m.get(&key)), Some(record));
    }

    #[test]
    fn inbound_key_orders_by_chain_token_burn_id() {
        let keys: [InboundKey; 6] = [
            ((8453, [0; 20]), 0),
            ((1, [2; 20]), 0),
            ((1, [1; 20]), 300),
            ((1, [1; 20]), 5),
            ((1, [1; 20]), 256),
            ((1, [1; 20]), 1),
        ];
        with_inbound(|m| {
            for key in keys {
                m.insert(key, inbound(EvmChain::Ethereum, key.1, U256::from(key.1)));
            }
        });
        let order: Vec<InboundKey> = with_inbound(|m| m.iter().map(|e| *e.key()).collect());
        assert_eq!(
            order,
            vec![
                ((1, [1; 20]), 1),
                ((1, [1; 20]), 5),
                ((1, [1; 20]), 256),
                ((1, [1; 20]), 300),
                ((1, [2; 20]), 0),
                ((8453, [0; 20]), 0),
            ]
        );

        let key: InboundKey = ((1, [1; 20]), 5);
        let bytes = key.to_bytes();
        assert_eq!(bytes.len(), 36);
        assert_eq!(&bytes[..8], &1u64.to_be_bytes());
        assert_eq!(&bytes[8..28], &[1; 20]);
        assert_eq!(&bytes[28..], &5u64.to_be_bytes());
        assert_eq!(
            <InboundKey as Storable>::BOUND,
            Bound::Bounded {
                max_size: 36,
                is_fixed_size: true
            }
        );
    }

    #[test]
    fn every_map_stores_and_reads_back() {
        let transfer = OutboundTransfer {
            id: 3,
            from: Account {
                owner: Principal::from_slice(&[5; 29]),
                subaccount: Some([2; 32]),
            },
            chain: EvmChain::Ethereum,
            recipient: "0x0A82D20142d067C8AF32f48664bDDfb65EcAE507".to_string(),
            amount: Nat::from(250_000_000u64),
            created_at: 11,
            status: OutboundStatus::Burned { icp_burn_index: 99 },
        };
        with_outbound(|m| m.insert(3, transfer.clone()));
        assert_eq!(with_outbound(|m| m.get(&3)), Some(transfer));

        let key: InboundKey = ((1, [7; 20]), 42);
        with_queue(|m| m.insert(0, key));
        assert_eq!(with_queue(|m| m.get(&0)), Some(key));

        let action = SignedAdminAction {
            id: 0,
            chain: EvmChain::Base,
            chain_id: 8453,
            token: [0x10; 20],
            calls: vec![([0x20; 20], vec![1, 2, 3]), ([0x30; 20], vec![])],
            deadline: 1_900_000_000,
            digest: [0x40; 32],
            signature: [0x50; 65],
            description: "SetMinBurnToIcp".to_string(),
            created_at: 12,
        };
        with_admin_actions(|m| m.insert(0, action.clone()));
        assert_eq!(with_admin_actions(|m| m.get(&0)), Some(action));
    }
}
