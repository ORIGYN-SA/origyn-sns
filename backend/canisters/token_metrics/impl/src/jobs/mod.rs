pub mod sync_governance;

pub(crate) fn start() {
    sync_governance::start_job()
}
