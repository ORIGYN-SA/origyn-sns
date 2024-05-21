use crate::generate_update_call;

use super_stats_v3_api::{queries::get_account_history, stats::updates::init_target_ledger, timers::updates::start_processing_timers};

generate_update_call!(get_account_history);
generate_update_call!(init_target_ledger);
generate_update_call!(start_processing_timers);
