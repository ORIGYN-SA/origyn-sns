use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager, VirtualMemory},
    DefaultMemoryImpl,
};

pub type VM = VirtualMemory<DefaultMemoryImpl>;
const UPGRADES: MemoryId = MemoryId::new(0);

thread_local! {
    static MEMORY_MANAGER: MemoryManager<DefaultMemoryImpl> = MemoryManager::init(
        DefaultMemoryImpl::default()
    );
}

pub fn get_upgrades_memory() -> VM {
    get_memory(UPGRADES)
}

/// Memory ids 1 to 4 hold the bridge's stable maps (see `bridge::stable`).
pub fn get_bridge_memory(n: u8) -> VM {
    assert!((1..=4).contains(&n), "bridge memory id {n} is not in 1..=4");
    get_memory(MemoryId::new(n))
}

fn get_memory(id: MemoryId) -> VM {
    MEMORY_MANAGER.with(|m| m.get(id))
}
