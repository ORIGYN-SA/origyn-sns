use crate::state::{mutate_state, read_state};
use bity_ic_canister_time::run_now_then_interval;
use ic_cdk::api::canister_self;
use ic_cdk_management_canister::{
    http_request, HttpHeader, HttpMethod, HttpRequestArgs, HttpRequestResult, TransformArgs,
    TransformContext, TransformFunc,
};
use std::time::Duration;
use tracing::{debug, error, info};
use types::Milliseconds;

const COMPUTE_STATS_JOB_INTERVAL: Milliseconds = 10 * 60 * 1000; // 10 minutes

pub fn start_job() {
    debug!("Starting the job to compute total locked value of collections");
    run_now_then_interval(Duration::from_millis(COMPUTE_STATS_JOB_INTERVAL), run);
}

pub fn run() {
    ic_cdk::futures::spawn(compute_stats());
}

async fn compute_stats() {
    info!("Starting compute_stats job");
    let total_value_locked: u64 = read_state(|state| {
        state
            .data
            .collections
            .get_all_collections()
            .iter()
            .filter_map(|collection| collection.locked_value_usd)
            .sum()
    });

    match (fetch_gold_grams().await, get_gold_price_per_gram_cents().await) {
        (Some(gold_grams), Some(gold_price_per_gram_cents)) => {
            info!("Fetched gold price per gram: {} cents", gold_price_per_gram_cents);
            let gold_price_per_gram_usd = gold_price_per_gram_cents / 100.0;

            // total value = (grams * cents / gram) / 100
            let gold_total_value_locked = ((gold_grams as f64 * gold_price_per_gram_cents) / 100.0) as u64;

            let overall_calculated = total_value_locked.saturating_add(gold_total_value_locked);

            info!(
                "Computed overall TVL: {} USD (Calculated: {} USD, Gold: {} USD ({} grams at ${:.2}/gram)",
                overall_calculated,
                total_value_locked,
                gold_total_value_locked,
                gold_grams,
                gold_price_per_gram_usd,
            );

            mutate_state(|state| {
                state.data.overall_stats.total_value_locked = overall_calculated;
            });
        }
        _ => {
            error!("Skipping TVL update this run: failed to fetch gold price and/or gold grams from external source(s).");
        }
    }

    mutate_state(|state| {
        state.data.overall_stats.total_collections =
            state.data.collections.total_collections() as usize;
    });
}

pub async fn get_gold_price_per_gram_cents() -> Option<f64> {
    let url = "https://api.gldt.org/v1/tokens/gold/price/latest";

    let request = HttpRequestArgs {
        url: url.to_string(),
        method: HttpMethod::GET,
        body: None,
        max_response_bytes: Some(1024),
        transform: Some(TransformContext {
            function: TransformFunc::new(canister_self(), "transform".to_string()),
            context: vec![],
        }),
        headers: vec![],
        is_replicated: None,
    };

    match http_request(&request).await {
        Ok(response) => {
            let str_body = match String::from_utf8(response.body) {
                Ok(body) => body,
                Err(e) => {
                    error!("Transformed response is not UTF-8 encoded: {:?}", e);
                    return None;
                }
            };

            match str_body.trim().parse::<f64>() {
                Ok(price) => {
                    info!("Fetched latest gold price: {}", price);
                    Some(price * 100.0) // USD per gram to cents per gram
                }
                Err(e) => {
                    error!(
                        "Failed to parse latest gold price: {} (body: {:?})",
                        e, str_body
                    );
                    None
                }
            }
        }
        Err(e) => {
            error!("error fetching latest gold price: {:?}", e);
            None
        }
    }
}

// Strips all data that is not needed from the original response.
// Read more here https://internetcomputer.org/docs/references/ic-interface-spec#ic-http_request
#[ic_cdk::query(hidden = true)]
pub fn transform(raw: TransformArgs) -> HttpRequestResult {
    let headers = vec![
        HttpHeader {
            name: "Content-Security-Policy".to_string(),
            value: "default-src 'self'".to_string(),
        },
        HttpHeader {
            name: "Referrer-Policy".to_string(),
            value: "strict-origin".to_string(),
        },
        HttpHeader {
            name: "Permissions-Policy".to_string(),
            value: "geolocation=(self)".to_string(),
        },
        HttpHeader {
            name: "Strict-Transport-Security".to_string(),
            value: "max-age=63072000".to_string(),
        },
        HttpHeader {
            name: "X-Frame-Options".to_string(),
            value: "DENY".to_string(),
        },
        HttpHeader {
            name: "X-Content-Type-Options".to_string(),
            value: "nosniff".to_string(),
        },
    ];

    let mut res = HttpRequestResult {
        status: raw.response.status.clone(),
        body: raw.response.body.clone(),
        headers,
        ..Default::default()
    };

    if res.status == 200u8 {
        res.body = raw.response.body;
    } else {
        info!(
            "Received an error from price source: err = {:?}",
            raw
        );
    }
    res
}


async fn fetch_gold_grams() -> Option<u64> {
    let config = read_state(|state| state.data.gold_collections_config.clone());
    let mut total_grams = 0u64;

    if let Some(c_1g) = config.canister_id_1g {
        match crate::services::origyn_nft::get_total_supply(c_1g).await {
            Ok(supply) => {
                total_grams = total_grams.saturating_add(u64::try_from(supply.0).expect("Error").saturating_mul(1));
            }
            Err(e) => {
                error!("Failed to fetch supply for gold 1g collection {c_1g}: {e:?}");
                return None;
            }
        }
    }
    if let Some(c_10g) = config.canister_id_10g {
        match crate::services::origyn_nft::get_total_supply(c_10g).await {
            Ok(supply) => {
                total_grams = total_grams.saturating_add(u64::try_from(supply.0).expect("Error").saturating_mul(10));
            }
            Err(e) => {
                error!("Failed to fetch supply for gold 10g collection {c_10g}: {e:?}");
                return None;
            }
        }
    }
    if let Some(c_100g) = config.canister_id_100g {
        match crate::services::origyn_nft::get_total_supply(c_100g).await {
            Ok(supply) => {
                total_grams = total_grams.saturating_add(u64::try_from(supply.0).expect("Error").saturating_mul(100));
            }
            Err(e) => {
                error!("Failed to fetch supply for gold 100g collection {c_100g}: {e:?}");
                return None;
            }
        }
    }
    if let Some(c_1kg) = config.canister_id_1kg {
        match crate::services::origyn_nft::get_total_supply(c_1kg).await {
            Ok(supply) => {
                total_grams = total_grams.saturating_add(u64::try_from(supply.0).expect("Error").saturating_mul(1000));
            }
            Err(e) => {
                error!("Failed to fetch supply for gold 1kg collection {c_1kg}: {e:?}");
                return None;
            }
        }
    }

    Some(total_grams)
}