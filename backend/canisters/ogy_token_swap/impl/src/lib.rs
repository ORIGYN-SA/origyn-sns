use ic_cdk::export_candid;
use lifecycle::Args;
use types::{HttpRequest, HttpResponse};

mod guards;
mod jobs;
mod lifecycle;
mod memory;
mod model;
mod queries;
mod state;
mod updates;

export_candid!();
