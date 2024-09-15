use ic_cdk::export_candid;

mod memory;
mod lifecycle;
mod guards;
pub mod queries;
pub mod updates;
pub mod state;

use lifecycle::*;
use queries::*;
use updates::*;

export_candid!();
