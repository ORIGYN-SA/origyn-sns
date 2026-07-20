use ic_cdk::query;

// The whitelist gate on `swap_tokens` has been removed: anyone can swap. This
// query is kept for frontend compatibility and always reports the caller as
// whitelisted so existing clients don't gate the swap UI.
#[query]
async fn is_caller_whitelisted() -> bool {
    true
}
