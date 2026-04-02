use crate::{generate_pocket_query_call, generate_pocket_update_call};
use nns_governance_canister::*;

// Queries
generate_pocket_query_call!(list_proposals);
generate_pocket_query_call!(list_neurons);

// Updates

generate_pocket_update_call!(manage_neuron);
