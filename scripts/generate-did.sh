cargo build --target wasm32-unknown-unknown --target-dir ./target --release --locked -p ogy_token_swap

defaultpath="backend/canisters/ogy_token_swap/api"
did_path="${outpath:-$defaultpath}"

candid-extractor "target/wasm32-unknown-unknown/release/ogy_token_swap.wasm" > $did_path/can.did
