dfx canister install --ic fcz32-miaaa-aaaag-abpha-cai --wasm 'backend/integration_tests/wasms/ogy-legacy-ledger.wasm' --argument '(record {
  send_whitelist = vec {};
  token_symbol = opt "OGY";
  transfer_fee = opt record {e8s = 200_000 };
  minting_account = "0dbad1cec635d530ac6b1eaa3fc5390e1aa4e4c87a80f114e9da168c76841009";
  transaction_window = null;
  max_message_size_bytes = null;
  icrc1_minting_account = null;
  archive_options = null;
  initial_values = vec {};
  token_name = opt "Origyn";
})' --mode reinstall

dfx canister install --ic fcz32-miaaa-aaaag-abpha-cai --wasm 'backend/integration_tests/wasms/ogy-legacy-ledger.gz' --argument "(record {
  minting_account = \"0dbad1cec635d530ac6b1eaa3fc5390e1aa4e4c87a80f114e9da168c76841009\";
  initial_values = vec {
    record {
      \"badd4bf150c74072335920b63bfa5cc4dcba11bc325e7aa26734d7c8735174ed\";
      record {
        e8s = 1_000_000_000_000_000_000: nat64
      }
    }
  };
  max_message_size_bytes = null;
  transaction_window = opt record {
    secs = 600:nat64;
    nanos=0:nat32;};
  archive_options = opt record {
    trigger_threshold = 2000: nat64;
    num_blocks_to_archive = 1000: nat64;
    node_max_memory_size_bytes = null;
    max_message_size_bytes = null;
    controller_id = principal \"jf4o7-6zzxo-5n6ru-k7dg2-pkyl2-jmnhi-frwzq-anevx-7b5si-spceg-pae\";};
  standard_whitelist = vec {};
  transfer_fee = opt(record {e8s = 200_000: nat64});
  admin = principal \"jf4o7-6zzxo-5n6ru-k7dg2-pkyl2-jmnhi-frwzq-anevx-7b5si-spceg-pae\";
  send_whitelist = vec {};
  token_symbol = opt \"OGY\";
  token_name = opt \"Origyn\";
  })" --mode reinstall
