use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager, VirtualMemory},
    DefaultMemoryImpl,
};

// Memory region IDs
const UPGRADES: MemoryId = MemoryId::new(0);
pub const ACCOUNT_OVERVIEWS: MemoryId = MemoryId::new(1);
pub const ACCOUNT_HISTORY: MemoryId = MemoryId::new(2);
pub const ACCOUNT_HISTORY_CACHE: MemoryId = MemoryId::new(3);
// Regions 4-8 reserved (previously used by principal maps and directory)
pub const ACTIVITY_SNAPSHOTS: MemoryId = MemoryId::new(9);
pub const TRANSACTION_CACHE: MemoryId = MemoryId::new(10);
pub const WALLETS_LIST: MemoryId = MemoryId::new(11);
pub const MERGED_WALLETS_LIST: MemoryId = MemoryId::new(12);
pub const GOV_STAKE_HISTORY: MemoryId = MemoryId::new(13);
pub const VOTING_POWER_RATIO: MemoryId = MemoryId::new(14);

pub type VM = VirtualMemory<DefaultMemoryImpl>;

thread_local! {
    static MEMORY_MANAGER: MemoryManager<DefaultMemoryImpl> = MemoryManager::init(
        DefaultMemoryImpl::default()
    );
}

pub fn get_upgrades_memory() -> VM {
    get_memory(UPGRADES)
}

pub fn get_memory(id: MemoryId) -> VM {
    MEMORY_MANAGER.with(|m| m.get(id))
}
