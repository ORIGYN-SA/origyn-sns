pub mod sync_governance;
pub mod sync_supply_data;
pub mod update_balance_list;

pub(crate) fn start() {
    // sync_governance::start_job();
    update_balance_list::_start_job_if_not_started();
}
