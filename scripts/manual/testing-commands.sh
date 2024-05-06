## mint tokens to account
export PRINCIPAL=2mvjk-dgy2v-qo7oz-p62sn-cllrc-r3ftx-fvfbw-vnnwh-n6u3r-rjofp-vqe # Audran plug test

465sx-szz6o-idcax-nrjhv-hprrp-qqx5e-7mqwr-wadib-uo7ap-lofbe-dae # gld staging

dfx identity use gitlab_origyn_staging
dfx canister call --network staging ogy_ledger icrc1_transfer
dfx canister call --network staging ogy_legacy_ledger icrc1_transfer

dfx canister call --network staging ogy_ledger icrc1_balance_of

dfx canister call --network staging ogy_legacy_ledger transfer
