#!/usr/bin/env bash


###############
### FOR STAGING
###############

./scripts/build-canister.sh collection_index &&
./scripts/generate-did.sh collection_index &&
./scripts/build-canister.sh collection_index &&
# dfx deploy --network staging sns_rewards --argument '(record {test_mode = true})' --mode reinstall
dfx deploy --network staging collection_index --argument "(record {
    test_mode = true;
    authorized_principals = vec { principal \"jqdha-t6k7d-iitf4-6mxtc-dzkp2-kpk7c-mmtnp-ab2ef-xotlg-5m5qc-3qe\" };
})" --mode reinstall

# insert a bunch of collections

dfx canister call --network staging collection_index insert_category "(record { category_name = \"Metals\"; })"
dfx canister call --network staging collection_index insert_category "(record { category_name = \"meme NFTS\"; })"
dfx canister call --network staging collection_index insert_category "(record { category_name = \"Cars\"; })"
dfx canister call --network staging collection_index insert_category "(record { category_name = \"Diamonds\"; })"
dfx canister call --network staging collection_index insert_category "(record { category_name = \"Art\"; })"



# GLD NFT 1g prod
dfx canister call --network staging collection_index insert_collection "(record {is_promoted = true; collection_canister_id = principal \"io7gn-vyaaa-aaaak-qcbiq-cai\"; category = 0; })"

# GLD NFT 10g prod
dfx canister call --network staging collection_index insert_collection "(record {is_promoted = true; collection_canister_id = principal \"sy3ra-iqaaa-aaaao-aixda-cai\"; category = 0; })"

# GLD NFT 1g staging 
dfx canister call --network staging collection_index insert_collection "(record {is_promoted = true; collection_canister_id = principal \"obapm-2iaaa-aaaak-qcgca-cai\"; category = 0; })"

# GLD NFT 10g staging
dfx canister call --network staging collection_index insert_collection "(record {is_promoted = false; collection_canister_id = principal \"xyo2o-gyaaa-aaaal-qb55a-cai\"; category = 0; })"

# Federitaly classic
dfx canister call --network staging collection_index insert_collection "(record {is_promoted = false; collection_canister_id = principal \"nszbk-7iaaa-aaaap-abczq-cai\"; category = 2; })"

# IGI Diamonds
dfx canister call --network staging collection_index insert_collection "(record {is_promoted = false; collection_canister_id = principal \"lyhlf-uqaaa-aaaap-abj7q-cai\"; category = 1; })"

# Watches
dfx canister call --network staging collection_index insert_collection "(record {is_promoted = false; collection_canister_id = principal \"4clim-pyaaa-aaaap-abkaa-cai\"; category = 4; })"

# Suzanne Syz collection
dfx canister call --network staging collection_index insert_collection "(record {is_promoted = false; collection_canister_id = principal \"gq4qu-3iaaa-aaaap-ahnfa-cai\"; category = 1; })"

# Cyber
dfx canister call --network staging collection_index insert_collection "(record {is_promoted = false; collection_canister_id = principal \"hpcxb-6qaaa-aaaap-ahsea-cai\"; category = 3; })"
