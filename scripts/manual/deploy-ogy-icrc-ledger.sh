#!/usr/bin/env bash

dfx deploy ogy_ledger --network staging --argument "(variant {Init =
record {
     token_symbol = \"OGY\";
     token_name = \"Origyn\";
     minting_account = record { owner = principal \"$(dfx identity get-principal)\" };
     transfer_fee = 200_000;
     metadata = vec {};
     initial_balances = vec {};
     archive_options = record {
         num_blocks_to_archive = 1000;
         trigger_threshold = 2000;
         controller_id = principal \"$(dfx identity get-principal)\";
         cycles_for_archive_creation = opt 10_000_000_000_000;
     };
 }
})"
