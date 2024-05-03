mod core;
mod indexer;
mod timers;
mod test_data;


mod tests {
    use crate::{core::{types::IDKey, stable_memory::STABLE_STATE}, test_data::{test_state_init, self, ptx_test_data}, indexer::{process_data::{small_tx::{processedtx_to_smalltx, smalltx_to_processedtx}, process_index::process_smtx_to_index}, account_tree::LinkData}};

    #[test]
    fn test_string_to_key(){
        let input: String = "8c79044b039ee8afbf1e8cc679d93cdfddfdf28710691aa9c81b85d7ef253206".to_string();
        let as_key: IDKey = IDKey::from_string(&input).unwrap();
        let output:String  = as_key.to_string().unwrap();
        assert_eq!(input, output);

        let input2: String = "q6osm-57cdv-5zmcc-p7dtq-v2lpi-uuzkr-pzhgf-lncpe-ns2yr-cxqsc-uqe.0000000000000000000000000000000000000000000000000000000000000000".to_string();
        let as_key2:IDKey = IDKey::from_string(&input2).unwrap();
        let output2: String = as_key2.to_string().unwrap();
        assert_eq!(input2, output2);

        let input3: String = "q6osm".to_string();
        let as_key3:IDKey  = IDKey::from_string(&input3).unwrap();
        let output3: String = as_key3.to_string().unwrap();
        assert_eq!(input3, output3);
    }

    #[test]
    fn test_process_to_small_tx_format(){

        // init test Stable/ Runtime state
        test_state_init();

        let ptx = ptx_test_data();
        let stx = processedtx_to_smalltx(&ptx);

        // TRANSACTION TYPE
        // Processed TX 10
        let first_ptx = ptx[10].clone();
        // Small TX 10
        let first_stx = stx[10].clone();

        // from account to u32 ref (using Directory)
        let id_ref_from = STABLE_STATE.with(|s|{
            s.borrow().as_ref().unwrap().directory_data.get_ref(&first_ptx.from_account)
        });

        // to account to u32 ref (using Directory)
        let id_ref_to = STABLE_STATE.with(|s|{
            s.borrow().as_ref().unwrap().directory_data.get_ref(&first_ptx.to_account)
        });
        
        // check from ac on Small TX = from ac on Processed TX
        assert_eq!(first_stx.from, id_ref_from);
        // check to ac on Small TX = to ac on Processed TX
        assert_eq!(first_stx.to, id_ref_to);
        // check time
        assert_eq!(first_stx.time, first_ptx.tx_time);
        // check type
        assert_eq!(first_stx.tx_type, 0_u8); // 0 = transfer, 1 = Mint, 2 = Burn. 3 = approve.
        // check value
        assert_eq!(first_stx.value, first_ptx.tx_value);
        // check block
        assert_eq!(first_stx.block, first_ptx.block);

        // MINT TYPE - TX0
        let mint_ptx = ptx[0].clone();
        // Small TX 10
        let mint_stx = stx[0].clone();

        // from account to u32 ref (using Directory)
        let mint_ref_from = STABLE_STATE.with(|s|{
            s.borrow().as_ref().unwrap().directory_data.get_ref(&mint_ptx.from_account)
        });

        // to account to u32 ref (using Directory)
        let mint_ref_to = STABLE_STATE.with(|s|{
            s.borrow().as_ref().unwrap().directory_data.get_ref(&mint_ptx.to_account)
        });
        
        // check from ac on Small TX = from ac on Processed TX
        assert_eq!(mint_stx.from, mint_ref_from);
        // check to ac on Small TX = to ac on Processed TX
        assert_eq!(mint_stx.to, mint_ref_to);
        // check time
        assert_eq!(mint_stx.time, mint_ptx.tx_time);
        // check type
        assert_eq!(mint_stx.tx_type, 1_u8); // 0 = transfer, 1 = Mint, 2 = Burn. 3 = approve.
        // check value
        assert_eq!(mint_stx.value, mint_ptx.tx_value);
        // check block
        assert_eq!(mint_stx.block, mint_ptx.block);

        // // BURN TYPE
        let burn_ptx = ptx[16].clone();
        // Small TX 10
        let burn_stx = stx[16].clone();

        // from account to u32 ref (using Directory)
        let burn_ref_from = STABLE_STATE.with(|s|{
            s.borrow().as_ref().unwrap().directory_data.get_ref(&burn_ptx.from_account)
        });

        // to account to u32 ref (using Directory)
        let burn_ref_to = STABLE_STATE.with(|s|{
            s.borrow().as_ref().unwrap().directory_data.get_ref(&burn_ptx.to_account)
        });
        
        // check from ac on Small TX = from ac on Processed TX
        assert_eq!(burn_stx.from, burn_ref_from);
        // check to ac on Small TX = to ac on Processed TX
        assert_eq!(burn_stx.to, burn_ref_to);
        // check time
        assert_eq!(burn_stx.time, burn_ptx.tx_time);
        // check type
        assert_eq!(burn_stx.tx_type, 2_u8); // 0 = transfer, 1 = Mint, 2 = Burn. 3 = approve.
        // check value
        assert_eq!(burn_stx.value, burn_ptx.tx_value);
        // check block
        assert_eq!(burn_stx.block, burn_ptx.block);

        // // APPROVE TYPE
        let ap_ptx = ptx[30].clone();
        // Small TX 10
        let ap_stx = stx[30].clone();

        // from account to u32 ref (using Directory)
        let ap_ref_from = STABLE_STATE.with(|s|{
            s.borrow().as_ref().unwrap().directory_data.get_ref(&ap_ptx.from_account)
        });

        // to account to u32 ref (using Directory)
        let ap_ref_to = STABLE_STATE.with(|s|{
            s.borrow().as_ref().unwrap().directory_data.get_ref(&ap_ptx.to_account)
        });
        
        // check from ac on Small TX = from ac on Processed TX
        assert_eq!(ap_stx.from, ap_ref_from);
        // check to ac on Small TX = to ac on Processed TX
        assert_eq!(ap_stx.to, ap_ref_to);
        // check time
        assert_eq!(ap_stx.time, ap_ptx.tx_time);
        // check type
        assert_eq!(ap_stx.tx_type, 3_u8); // 0 = transfer, 1 = Mint, 2 = Burn. 3 = approve.
        // check value
        assert_eq!(ap_stx.value, ap_ptx.tx_value);
        // check block
        assert_eq!(ap_stx.block, ap_ptx.block);

        // check input length == output length.
        assert_eq!(ptx.len(), stx.len()); 
    }

    #[test]
    fn test_calculate_balances(){
        // init test Stable/ Runtime state
        test_state_init();

        let ptx = ptx_test_data();
        let stx = processedtx_to_smalltx(&ptx);
        let _inx = process_smtx_to_index(stx);

        // check account 1
        let ac1 = "220c3a33f90601896e26f76fa619fe288742df1fa75426edfaf759d39f2455a5".to_string();
        let res1 = STABLE_STATE.with(|s|{
            s.borrow().as_ref().unwrap().get_fulldata_by_id_raw(&ac1)
        });
        let res2 = res1.unwrap();
        
        let all_links = res2.clone().links;
        // First Active 
        assert_eq!(&res2.overview.first_active, &1_687_939_200_000_000_000);
        // Last Active 
        assert_eq!(&res2.overview.last_active, &1_698_888_888_888_888_888);
        // Sent Count
        assert_eq!(&res2.overview.sent.0, &7);
        // Sent Value
        assert_eq!(&res2.overview.sent.1, &730620000);
        // Received Count
        assert_eq!(&res2.overview.received.0, &4);
        // Received Value
        assert_eq!(&res2.overview.received.1, &101000090001);
        // Balance
        assert_eq!(&res2.overview.balance, &100_269_470_001);
        // Link Data
        let ld1 = LinkData{ 
            linked_from: 1687988709540000000, linked_id: 1, number_txs: 2, gross: 100090000, net: -99910000 };
        assert_eq!(&all_links[0], &ld1);
        let ld2 = LinkData{ 
            linked_from: 1687980500040000000, linked_id: 4, number_txs: 1, gross: 0, net: 0 };
        assert_eq!(&all_links[1], &ld2);
        let ld3 = LinkData{ 
            linked_from: 1687988705540000000, linked_id: 5, number_txs: 2, gross: 500001, net: -499999 };
        assert_eq!(&all_links[2], &ld3);
        let ld4 = LinkData{ 
            linked_from: 1687980700040000000, linked_id: 6, number_txs: 2, gross: 600000000, net: -600000000 };
        assert_eq!(&all_links[3], &ld4);
        let ld5 = LinkData{ 
            linked_from: 1687988718000000000, linked_id: 8, number_txs: 1, gross: 30000000, net: -30000000 };
        assert_eq!(&all_links[4], &ld5);
        // Blocks
        let blocks = Vec::from([0, 10, 11, 15, 17, 20, 23, 27, 28, 29, 30]);
        assert_eq!(&res2.blocks, &blocks);
    }    

    #[test]
    fn full_cycle(){
        test_state_init();

        let ptx = ptx_test_data();
        let stx = processedtx_to_smalltx(&ptx);
        let back = smalltx_to_processedtx(&stx);
        assert_eq!(ptx[0], back[0]); // mint
        assert_eq!(ptx[10], back[10]); // transfer
        assert_eq!(ptx[16], back[16]); // burn
        assert_eq!(ptx[30], back[30]); // approve
    }

}