# Super Indexer V3

Forked from [https://github.com/SaorsaLabs/221BravoApp_v3](https://github.com/SaorsaLabs/221BravoApp_v3).

The Super Index Canister is one of the core backend canisters providing data to the 221Bravo App. The canister periodically checks for new transactions coming from an ICRC ledger canister and then processes these transactions to create an index of user balances, linked accounts, accounts stats and linked transactions. 

In order to store this information, the Super Index Canister works alongside the TX Store V3 canister. The Super Index canister will not work without an associated transaction store.  

## Deploy/ Setup

The first step is to deploy a blank index canister and blank TX store. Both canisters can be deployed in the usual way, however they require an argument giving the initial admin principal. This principle will initially be the only person who can call the canister methods. Replace $(dfx identity get-principal) with a specific principal if required - eg '("2vxsx-fae")'

```bash
dfx deploy super_indexer_v3 --network ic --argument $(dfx identity get-principal) 
dfx deploy tx_store_v3 --network ic --argument $(dfx identity get-principal) 
```

Once the canisters are deployed, the next step is to initialise the super indexer canister setting the target ledger principal, transaction store principal and target ledger type. There are currently 3 types of supported version of the ICRC ledger: 

* DfinityIcp – The implementation of ICRC-1 that is used on the ICP ledger and OGY ledger.
* DfinityIcrc2 – The implementation of ICRC-1 and ICRC-2 used by SNS Projects and CK Tokens ledgers. 
* MemeIcrc – The implementation of ICRC-1 used by EXE, SNEED (old) and several other meme tokens. (NatLabs ICRC-1 canister). 

Your required ledger type can simply be chosen in the init argument below:

```bash
dfx canister call super_indexer_v3 --network ic init_target_ledger '(record {
                                                                        target_ledger = " xxxx-xxxxx-xxxx-xxxx-xxx ";
                                                                        tx_store = "xxxx-xxxxx-xxxx-xxxx-xxx"
                                                                    }, variant { "DfinityIcrc2" })'
```

If successful you should get the response “Target canister, tx store, fee and decimals set”. This indicates that the canister was able to register with the tx store and was able to communicate with the ledger canister. 
At this point you may want to add further cycles to the tx store and indexer canister. 
Finally, you need to start a processing timer which will check the ledger for new transactions and process these into the index. The only argument is the number of seconds the timer should wait between calls to the target ledger. Anything between 60 and 900 seconds will likely suit your needs. 

```bash
dfx canister call super_indexer_v3 --network ic start_processing_timer '(60: nat64)'
``` 

The index canister will then work through the history of the ledger in batches of 10,000 transactions and then continue to pull new transactions as available. 

You can check the canister logs to get an idea of the progress of the data-fetching with this argument `dfx canister call super_indexer_v3 –network ic get_all_logs`

## Available Methods
All available methods can be found in the API.rs files in ./core ./indexer and ./timers