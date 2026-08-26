pub mod compute_stats;
pub mod sync_collections;
pub mod sync_supplies;

pub(crate) fn start() {
    compute_stats::start_job();
    sync_collections::start_job();
    sync_supplies::start_job();
}
