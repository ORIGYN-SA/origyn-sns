use ic_stable_structures::{
    memory_manager::{ MemoryId, MemoryManager, VirtualMemory },
    DefaultMemoryImpl,
};

const UPGRADES: MemoryId = MemoryId::new(0);
const COLLECTION_MEMORY: MemoryId = MemoryId::new(1);

pub type VM = VirtualMemory<DefaultMemoryImpl>;

thread_local! {
    static MEMORY_MANAGER: MemoryManager<DefaultMemoryImpl> = MemoryManager::init(
        DefaultMemoryImpl::default()
    );
}

pub fn get_upgrades_memory() -> VM {
    get_memory(UPGRADES)
}

fn get_memory(id: MemoryId) -> VM {
    MEMORY_MANAGER.with(|m| m.get(id))
}

pub fn get_collection_model_memory() -> VM {
    get_memory(COLLECTION_MEMORY)
}
