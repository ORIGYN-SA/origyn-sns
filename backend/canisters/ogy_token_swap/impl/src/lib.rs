use ic_cdk::export_candid;

pub mod guards;
pub mod jobs;
pub mod lifecycle;
pub mod memory;
pub mod queries;
pub mod state;
pub mod updates;

use lifecycle::*;
use queries::*;
use updates::*;

export_candid!();
