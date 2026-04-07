use ic_cdk::export_candid;

mod guards;
mod jobs;
mod lifecycle;
mod memory;
mod migrations;
pub mod queries;
pub mod state;
pub mod updates;

use lifecycle::*;
use queries::*;
use updates::*;

export_candid!();
