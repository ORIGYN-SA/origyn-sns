use ic_cdk::query;

pub use ogy_token_swap_api::queries::list_swapping_statistics::{
    Args as ListSwappingStatisticsArgs,
    Response as ListSwappingStatisticsResponse,
};

use crate::state::read_state;

#[query]
async fn list_swapping_statistics() -> ListSwappingStatisticsResponse {
    list_swapping_statistics_impl()
}

fn list_swapping_statistics_impl() -> ListSwappingStatisticsResponse {
    read_state(|s| { s.data.token_swap.compute_swapping_statistics() })
}
