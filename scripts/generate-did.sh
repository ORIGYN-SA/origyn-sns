cargo build --target wasm32-unknown-unknown --target-dir ./target --release --locked -p token_metrics

defaultpath="backend/canisters/token_metrics/api"
did_path="${outpath:-$defaultpath}"

candid-extractor "target/wasm32-unknown-unknown/release/token_metrics.wasm" > $did_path/can.did
