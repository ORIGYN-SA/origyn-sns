use crate::{ generate_query_call, generate_update_call };

use sns_rewards_api_canister::*;

generate_update_call!(add_neuron_ownership);
generate_update_call!(remove_neuron_ownership);
generate_update_call!(claim_reward);
generate_query_call!(get_all_neurons);
generate_query_call!(get_neuron_by_id);
generate_query_call!(get_active_payment_rounds);
generate_update_call!(set_reserve_transfer_amounts);
generate_query_call!(set_reserve_transfer_amounts_validate);
generate_query_call!(get_reserve_transfer_amounts);
generate_query_call!(set_reward_token_types_validate);
generate_query_call!(get_reward_token_types);
generate_update_call!(set_reward_token_types);
generate_query_call!(get_historic_payment_round);
generate_update_call!(set_daily_ogy_burn_rate);
generate_query_call!(set_daily_ogy_burn_rate_validate);
