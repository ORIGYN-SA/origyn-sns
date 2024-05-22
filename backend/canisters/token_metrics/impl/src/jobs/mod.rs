pub mod sync_governance;
pub mod sync_supply_data;
pub mod update_balance_list;
pub mod sync_governance_history;

pub(crate) fn start() {
    sync_governance::start_job();
    sync_governance_history::start_job();
}
