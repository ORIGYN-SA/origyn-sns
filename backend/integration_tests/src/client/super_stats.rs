use crate::{ generate_query_call, generate_update_call };

use super_stats_v3_api::{
    core::queries::get_working_stats,
    stats::queries::get_account_history,
    stats::queries::get_principal_history,
    stats::updates::init_target_ledger,
    timers::updates::start_processing_timer,
};

generate_update_call!(init_target_ledger);
generate_update_call!(start_processing_timer);

generate_query_call!(get_working_stats);
generate_query_call!(get_principal_history);
generate_query_call!(get_account_history);
