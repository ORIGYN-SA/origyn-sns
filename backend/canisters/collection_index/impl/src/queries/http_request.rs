use http_request::{ build_json_response, encode_logs, extract_route, Route };
use ic_cdk_macros::query;
use types::{ HttpRequest, HttpResponse, TimestampMillis };

use crate::state::{ read_state, RuntimeState };

#[query(hidden = true)]
fn http_request(request: HttpRequest) -> HttpResponse {
    fn get_logs_impl(since: Option<TimestampMillis>) -> HttpResponse {
        encode_logs(canister_logger::export_logs(), since.unwrap_or(0))
    }

    fn get_traces_impl(since: Option<TimestampMillis>) -> HttpResponse {
        encode_logs(canister_logger::export_traces(), since.unwrap_or(0))
    }

    fn get_metrics_impl(state: &RuntimeState) -> HttpResponse {
        build_json_response(&state.metrics())
    }

    fn get_overall_stats(state: &RuntimeState) -> HttpResponse {
        build_json_response(&state.data.overall_stats)
    }

    match extract_route(&request.url) {
        Route::Logs(since) => get_logs_impl(since),
        Route::Traces(since) => get_traces_impl(since),
        Route::Metrics => read_state(get_metrics_impl),
        Route::OverallStats => read_state(get_overall_stats),
        Route::Other(_path, _) => { HttpResponse::not_found() }
        _ => HttpResponse::not_found(),
    }
}
