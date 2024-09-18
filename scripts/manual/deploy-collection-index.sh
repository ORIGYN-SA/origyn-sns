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

# insert GLD NFT 1g prod collection
dfx canister call --network staging collection_index insert_collection "(record {is_promoted = true; collection_canister_id = principal \"io7gn-vyaaa-aaaak-qcbiq-cai\" })"

#insert GLD NFT 10g prod collection
dfx canister call --network staging collection_index insert_collection "(record {is_promoted = false; collection_canister_id = principal \"sy3ra-iqaaa-aaaao-aixda-cai\" })"
