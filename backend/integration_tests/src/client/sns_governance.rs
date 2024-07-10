use crate::{ generate_query_call, generate_update_call };

use sns_governance_canister::{ manage_neuron, list_proposals };

generate_update_call!(manage_neuron);
generate_query_call!(list_proposals);
