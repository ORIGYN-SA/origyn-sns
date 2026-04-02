use crate::guards::caller_is_governance_principal;
use ic_cdk::update;

#[update(guard = "caller_is_governance_principal", hidden = true)]
pub fn process_nns_neurons_manual() {
    crate::jobs::process_nns_neurons::run();
}
