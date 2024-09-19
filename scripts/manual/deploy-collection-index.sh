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

# GLD NFT 1g prod 
dfx canister call --network staging collection_index insert_collection "(record {is_promoted = true; collection_canister_id = principal \"io7gn-vyaaa-aaaak-qcbiq-cai\" })"

# GLD NFT 10g prod
dfx canister call --network staging collection_index insert_collection "(record {is_promoted = false; collection_canister_id = principal \"sy3ra-iqaaa-aaaao-aixda-cai\" })"

# Federitaly classic
dfx canister call --network staging collection_index insert_collection "(record {is_promoted = false; collection_canister_id = principal \"nszbk-7iaaa-aaaap-abczq-cai\" })"

# IGI Diamonds
dfx canister call --network staging collection_index insert_collection "(record {is_promoted = false; collection_canister_id = principal \"lyhlf-uqaaa-aaaap-abj7q-cai\" })"

# Watches
dfx canister call --network staging collection_index insert_collection "(record {is_promoted = false; collection_canister_id = principal \"4clim-pyaaa-aaaap-abkaa-cai\" })"

# Suzanne Syz collection
dfx canister call --network staging collection_index insert_collection "(record {is_promoted = false; collection_canister_id = principal \"gq4qu-3iaaa-aaaap-ahnfa-cai\" })"

# Cyber
dfx canister call --network staging collection_index insert_collection "(record {is_promoted = false; collection_canister_id = principal \"hpcxb-6qaaa-aaaap-ahsea-cai\" })"
