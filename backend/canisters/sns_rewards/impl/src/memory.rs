use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager, VirtualMemory},
    DefaultMemoryImpl,
};

const UPGRADES: MemoryId = MemoryId::new(0);
// NOTE: The memory with id 1 was reserved for the old payment round history
const MATURITY_HISTORY: MemoryId = MemoryId::new(3);
// NOTE: The memory with id 2 was reserved for the old payment round history
const PAYMENT_ROUND_HISTORY: MemoryId = MemoryId::new(4);

const MATURITY_HISTORY_V0: MemoryId = MemoryId::new(1);
const PAYMENT_ROUND_HISTORY_V0: MemoryId = MemoryId::new(2);

pub type VM = VirtualMemory<DefaultMemoryImpl>;

thread_local! {
    static MEMORY_MANAGER: MemoryManager<DefaultMemoryImpl> = MemoryManager::init(
        DefaultMemoryImpl::default()
    );
}

pub fn get_upgrades_memory() -> VM {
    get_memory(UPGRADES)
}

pub fn get_maturity_history_memory_v0() -> VM {
    get_memory(MATURITY_HISTORY_V0)
}

pub fn get_maturity_history_memory() -> VM {
    get_memory(MATURITY_HISTORY)
}

fn get_memory(id: MemoryId) -> VM {
    MEMORY_MANAGER.with(|m| m.get(id))
}

pub fn get_payment_round_history_memory() -> VM {
    get_memory(PAYMENT_ROUND_HISTORY)
}

pub fn get_payment_round_history_memory_v0() -> VM {
    get_memory(PAYMENT_ROUND_HISTORY_V0)
}
