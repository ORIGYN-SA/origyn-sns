use std::{ collections::HashMap, hash::Hash, ops::Deref, time::{ SystemTime, UNIX_EPOCH } };

use ic_cdk_macros::{ update, query };
use ic_stable_memory::collections::SBTreeMap;
use crate::core::{
    runtime::RUNTIME_STATE,
    stable_memory::STABLE_STATE,
    working_stats::api_count,
    utils::log,
};

use super::{
    account_tree::{ GetAccountBalanceHistory, HistoryData, Overview },
    constants::HOUR_AS_NANOS,
    custom_types::{
        GetHoldersArgs,
        HolderBalance,
        HolderBalanceResponse,
        IndexerType,
        ProcessedTX,
        TimeStats,
        TotalHolderResponse,
    },
    directory::lookup_directory,
    fetch_data::{
        dfinity_icp::{ t1_impl_set_target_canister, SetTargetArgs },
        dfinity_icrc2::t2_impl_set_target_canister,
    },
    process_data::process_time_stats::{ calculate_time_stats, StatsType }, utils::{get_current_day, timestamp_nanos},
};


// [][] -- AUTH GATED -- [][]
// total holders ☑️
// top holders ☑️
// account balance  ☑️
// principal balance ☑️
// get hourly stats ☑️
// get daily stats ☑️













