pub mod process_nns_neurons;
pub mod process_sns_neurons;

pub(crate) fn start() {
    process_sns_neurons::start_job();
    process_nns_neurons::start_job();
}
