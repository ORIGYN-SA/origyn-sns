#!/usr/bin/env bash

dfx deploy --network staging ogy_legacy_ledger --argument "(record {
  minting_account = \"$(dfx ledger account-id)\";
  initial_values = vec {};
  max_message_size_bytes = null;
  transaction_window = opt record { secs = 600; nanos = 0};
  archive_options = null;
  standard_whitelist = vec {};
  transfer_fee = opt(record {e8s = 200_000: nat64});
  admin = principal \"$(dfx identity get-principal)\";
  send_whitelist = vec {};
  token_symbol = opt \"OGY\";
  token_name = opt \"Origyn\"
  } )" --mode reinstall
