use ic_cdk::export_candid;

mod jobs;
mod memory;
mod lifecycle;
pub mod utils;
pub mod queries;
pub mod state;

use lifecycle::*;
use queries::*;

export_candid!();
