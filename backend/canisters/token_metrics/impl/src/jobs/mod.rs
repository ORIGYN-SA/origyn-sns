pub mod sync_governance;
pub mod sync_supply_data;

pub(crate) fn start() {
    sync_governance::start_job();
    sync_supply_data::start_job();
}
