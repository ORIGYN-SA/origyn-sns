use crate::state::mutate_state;
use crate::state::read_state;
use candid::Principal;
use gldt_swap_common::bridge::{BridgeError, EvmChain};
use gldt_swap_common::nft::Nft;
use std::cell::RefCell;
use std::collections::{BTreeMap, BTreeSet};
use std::marker::PhantomData;

// TODO: think on the limit, how much NFTs are issued now? + how much can be issued in the future?
const MAX_CONCURRENT: usize = 100;

/// Guards a block from executing twice when called by the same user and from being
/// executed [MAX_CONCURRENT] or more times in parallel.
#[must_use]
pub struct GuardNft {
    nft: Nft,
    _marker: PhantomData<GuardNft>,
}

impl GuardNft {
    /// Attempts to create a new guard for the current block. Fails if there is
    /// already a pending request for the specified [nft] or if there
    /// are at least [MAX_CONCURRENT] pending requests.
    pub fn new(nft: Nft) -> Result<Self, String> {
        mutate_state(|s| {
            if s.data.nft_guards.contains(&nft) {
                return Err("Error: Duplicate request".to_string());
            }
            if s.data.nft_guards.len() >= MAX_CONCURRENT {
                return Err("Service is too busy, try again shortly".to_string());
            }
            s.data.nft_guards.insert(nft.clone());
            Ok(Self {
                nft,
                _marker: PhantomData,
            })
        })
    }
}

impl Drop for GuardNft {
    fn drop(&mut self) {
        mutate_state(|s| s.data.nft_guards.remove(&self.nft));
    }
}

pub fn caller_is_nft_canister() -> Result<(), String> {
    if read_state(|state| state.is_caller_is_nft_canister()) {
        Ok(())
    } else {
        Err("Caller is not a valid NFT canister".to_string())
    }
}

pub fn caller_is_authorized() -> Result<(), String> {
    if read_state(|state| state.is_caller_authorized()) {
        Ok(())
    } else {
        Err("Caller is not an authorized principal".to_string())
    }
}

pub fn reject_anonymous_caller() -> Result<(), String> {
    if ic_cdk::api::msg_caller() == Principal::anonymous() {
        return Err("You may not use an anonymous principal".to_string());
    }
    Ok(())
}

// Bridge guards
//
// They live on the heap only: every call and job they guard has ended before an upgrade,
// because an upgrade first stops the canister, which waits for every open call.

/// At most this many bridge calls run at once.
const MAX_CONCURRENT_BRIDGE_CALLS: usize = 100;

/// A job guard older than this no longer blocks a new run of the same job.
pub const JOB_LEASE_NANOS: u64 = 10 * 60 * 1_000_000_000;

thread_local! {
    static BRIDGE_CALLERS: RefCell<BTreeSet<Principal>> = const { RefCell::new(BTreeSet::new()) };
    static JOB_GUARDS: RefCell<BTreeMap<Job, u64>> = const { RefCell::new(BTreeMap::new()) };
    static OUTBOUND_IN_FLIGHT: RefCell<BTreeSet<u64>> = const { RefCell::new(BTreeSet::new()) };
}

/// One bridge call per caller at a time, released on drop like [GuardNft].
#[must_use]
pub struct BridgeCallerGuard {
    caller: Principal,
    _marker: PhantomData<BridgeCallerGuard>,
}

impl BridgeCallerGuard {
    pub fn new(caller: Principal) -> Result<Self, BridgeError> {
        BRIDGE_CALLERS.with_borrow_mut(|callers| {
            if callers.contains(&caller) || callers.len() >= MAX_CONCURRENT_BRIDGE_CALLS {
                return Err(BridgeError::Busy);
            }
            callers.insert(caller);
            Ok(Self {
                caller,
                _marker: PhantomData,
            })
        })
    }
}

impl Drop for BridgeCallerGuard {
    fn drop(&mut self) {
        BRIDGE_CALLERS.with_borrow_mut(|callers| callers.remove(&self.caller));
    }
}

// `Balancer` gets its caller in a later bridge task
#[allow(dead_code)]
#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub enum Job {
    Scrape(EvmChain),
    Process,
    Balancer,
}

/// Keeps a job from overlapping itself. Released on drop (also when the job traps after an
/// await), with a 10 minute lease as a backstop for a job that never finishes.
#[must_use]
pub struct JobGuard {
    job: Job,
    taken_at: u64,
    _marker: PhantomData<JobGuard>,
}

impl JobGuard {
    /// `None` while a guard for the same job is younger than [JOB_LEASE_NANOS].
    pub fn new(job: Job, now_nanos: u64) -> Option<JobGuard> {
        JOB_GUARDS.with_borrow_mut(|guards| {
            if let Some(&taken_at) = guards.get(&job) {
                if now_nanos.saturating_sub(taken_at) < JOB_LEASE_NANOS {
                    return None;
                }
            }
            guards.insert(job, now_nanos);
            Some(JobGuard {
                job,
                taken_at: now_nanos,
                _marker: PhantomData,
            })
        })
    }
}

impl Drop for JobGuard {
    fn drop(&mut self) {
        JOB_GUARDS.with_borrow_mut(|guards| {
            // after a lease ran out, a newer guard owns the entry; leave it alone
            if guards.get(&self.job) == Some(&self.taken_at) {
                guards.remove(&self.job);
            }
        });
    }
}

/// Marks an outbound transfer whose burn or voucher signing is awaiting an answer, so
/// `bridge_to_evm` and the processor never work on the same transfer at once.
/// Released on drop, also when the call traps after an await.
#[must_use]
pub struct OutboundGuard {
    id: u64,
    _marker: PhantomData<OutboundGuard>,
}

impl OutboundGuard {
    /// `None` while another call holds the transfer.
    pub fn new(id: u64) -> Option<Self> {
        // `then`, not `then_some`: a guard built on refusal would release the holder's id on drop
        let taken = OUTBOUND_IN_FLIGHT.with_borrow_mut(|in_flight| in_flight.insert(id));
        taken.then(|| Self {
            id,
            _marker: PhantomData,
        })
    }
}

impl Drop for OutboundGuard {
    fn drop(&mut self) {
        OUTBOUND_IN_FLIGHT.with_borrow_mut(|in_flight| in_flight.remove(&self.id));
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn job_guard_refuses_within_lease_and_allows_after_10_min() {
        let t0 = 1_700_000_000_000_000_000u64;
        let first = JobGuard::new(Job::Process, t0).expect("first guard");
        assert!(JobGuard::new(Job::Process, t0 + 1).is_none());
        assert!(JobGuard::new(Job::Process, t0 + JOB_LEASE_NANOS - 1).is_none());

        // other jobs have their own guard
        let scrape_eth = JobGuard::new(Job::Scrape(EvmChain::Ethereum), t0).expect("scrape eth");
        assert!(JobGuard::new(Job::Scrape(EvmChain::Base), t0).is_some());
        assert!(JobGuard::new(Job::Balancer, t0).is_some());

        // after 10 minutes a new guard takes over
        let second = JobGuard::new(Job::Process, t0 + JOB_LEASE_NANOS).expect("lease expired");
        // dropping the expired guard must not release the new one
        drop(first);
        assert!(JobGuard::new(Job::Process, t0 + JOB_LEASE_NANOS + 1).is_none());
        drop(second);
        assert!(JobGuard::new(Job::Process, t0 + JOB_LEASE_NANOS + 2).is_some());

        drop(scrape_eth);
        assert!(JobGuard::new(Job::Scrape(EvmChain::Ethereum), t0 + 3).is_some());
        assert_eq!(JOB_LEASE_NANOS, 600_000_000_000);
    }

    #[test]
    fn bridge_caller_guard_allows_one_call_per_caller() {
        let alice = Principal::from_slice(&[1; 29]);
        let bob = Principal::from_slice(&[2; 29]);
        let guard = BridgeCallerGuard::new(alice).expect("first call");
        assert_eq!(BridgeCallerGuard::new(alice).err(), Some(BridgeError::Busy));
        let bob_guard = BridgeCallerGuard::new(bob).expect("other caller");
        drop(guard);
        assert!(BridgeCallerGuard::new(alice).is_ok());
        drop(bob_guard);
    }

    #[test]
    fn outbound_guard_holds_one_transfer_at_a_time() {
        let first = OutboundGuard::new(3).expect("first");
        assert!(OutboundGuard::new(3).is_none());
        let other = OutboundGuard::new(4).expect("another transfer");
        drop(first);
        assert!(OutboundGuard::new(3).is_some());
        drop(other);
    }
}
