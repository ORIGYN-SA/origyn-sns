use canister_client::{ generate_candid_c2c_call, generate_candid_c2c_call_no_args };

pub mod queries;
use queries::{
    get_total_holders,
    get_daily_stats,
    get_hourly_stats,
    get_account_overview,
    get_top_account_holders,
    get_top_principal_holders,
    get_principal_overview,
};

// Queries
generate_candid_c2c_call!(get_top_account_holders);
generate_candid_c2c_call!(get_top_principal_holders);
generate_candid_c2c_call!(get_account_overview);
generate_candid_c2c_call!(get_principal_overview);
generate_candid_c2c_call_no_args!(get_total_holders);
generate_candid_c2c_call_no_args!(get_hourly_stats);
generate_candid_c2c_call_no_args!(get_daily_stats);

// Updates
