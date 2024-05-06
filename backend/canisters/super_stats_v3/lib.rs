mod core;
mod stats;
mod timers;
mod test_data;


mod tests {
    use crate::{
        core::{types::IDKey, stable_memory::STABLE_STATE, runtime::RUNTIME_STATE}, 
        test_data::{test_state_init, self, ptx_test_data}, 
        stats::{process_data::{
            small_tx::{processedtx_to_smalltx}, 
            process_index::process_smtx_to_index, 
            process_time_stats::{StatsType, calculate_time_stats, top_x_by_txvalue}}, 
            utils::{nearest_past_hour, nearest_day_start, principal_subaccount_to_string, parse_icrc_account}, 
            fetch_data::dfinity_icrc2_types::DEFAULT_SUBACCOUNT, 
            constants::{HOUR_AS_NANOS, DAY_AS_NANOS}, 
            custom_types::{IndexerType, ProcessedTX}}
        };

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
    fn test_nearest_past_hour() {
        //  Input already on an hour boundary
        let time_ms_1: u64 = 1687856400000000000; // 27/06/23 0900 gmt
        assert_eq!(nearest_past_hour(time_ms_1), time_ms_1);

        //  Input at half past hour
        let time_ms_2: u64 = 1687858200000000000; // 09:30:00 gmt
        assert_eq!(nearest_past_hour(time_ms_2), 1687856400000000000); // 27/06/23 0900 gmt

        // 1 nano before the hour
        let time_ms_3: u64 = 1687856399999999999;
        assert_eq!(nearest_past_hour(time_ms_3), 1687852800000000000); // 27/06/23 0800 gmt

        //  1 nano before end of the hour
        let time_ms_4: u64 = 1687859999999999999;
        assert_eq!(nearest_past_hour(time_ms_4), 1687856400000000000); // 27/06/23 0900 gmt
    }

    #[test]
    fn test_nearest_past_day() {
        //  Input already on an day boundary
        let time_ms_1: u64 = 1687824000000000000; // 27/06/23 0000 gmt
        assert_eq!(nearest_day_start(time_ms_1), time_ms_1);

        //  Input at mid-day (12:00)
        let time_ms_2: u64 = 1687867200000000000; 
        assert_eq!(nearest_day_start(time_ms_2), time_ms_1); // 27/06/23 0000 gmt

        // 1 nano after midnight
        let time_ms_3: u64 = 1687824000000000001;
        assert_eq!(nearest_day_start(time_ms_3), time_ms_1); // 27/06/23 0000 gmt

        //  1 nano before next day 
        let time_ms_4: u64 = 1687910399999999999;
        assert_eq!(nearest_day_start(time_ms_4), time_ms_1); // 27/06/23 0000 gmt
    }

    #[test]
    fn test_combine_ps(){
        let pr = String::from("2vxsx-fae");
        let sa = DEFAULT_SUBACCOUNT.to_string();
        let st = principal_subaccount_to_string(pr, sa);
        let res = String::from("2vxsx-fae.0000000000000000000000000000000000000000000000000000000000000000");
        assert_eq!(res, st);
    }

    #[test]
    fn test_parse_account(){
        let inpt = String::from("2vxsx-fae.0000000000000000000000000000000000000000000000000000000000000000");
        let output = parse_icrc_account(&inpt).unwrap();
        let pr = output.0;
        let ac = output.1;
        assert_eq!(pr, String::from("2vxsx-fae"));
        assert_eq!(ac, String::from("0000000000000000000000000000000000000000000000000000000000000000"));
    }

    // ICP LEDGER TYPE - 30 days
    #[test]
    fn process_daily_data(){
        // set hourly time
        RUNTIME_STATE.with(|s|{
            s.borrow_mut().data.latest_blocks.hours_nano = 30_u64 * DAY_AS_NANOS;
        });
        // set return len
        RUNTIME_STATE.with(|s|{
            s.borrow_mut().data.max_return_length = 5;
        });
        let time_now = 1_688_888_888_889_999_888;
        let process_from = RUNTIME_STATE.with(|s|{
            let hr_nanos = s.borrow().data.latest_blocks.hours_nano;
            return time_now - hr_nanos;
        });

        let test_txs = ptx_test_data();
        RUNTIME_STATE.with(|s|{
            s.borrow_mut().data.latest_blocks.push_tx_vec(test_txs)
        });

        let res = calculate_time_stats(process_from,StatsType::Daily, IndexerType::DfinityIcp, time_now);
        
        println!("RES :: {:?}", res);
        // totals
        assert_eq!(res.total_transaction_count, 31);
        assert_eq!(res.total_transaction_value, 1_004_132_500_001);
        assert_eq!(res.total_transaction_average, 32391370967.774193);

        // Mint/ Burn/ Transfer/ Approve stats
        let sum_all =   res.burn_stats.total_value +
                        res.mint_stats.total_value +
                        res.transfer_stats.total_value +
                        res.approve_stats.total_value;

        let count_all =   res.burn_stats.count +
                                res.mint_stats.count +
                                res.transfer_stats.count +
                                res.approve_stats.count; 

        assert_eq!(sum_all, 1_005_132_500_001); // 1_000_000_000 higher than total_transaction_value b/c approve is counted      
        assert_eq!(count_all, 31);

        // Count over time 
        let cot = res.count_over_time.clone();
        assert_eq!(cot.len(), 30); // 30 days of data

        let mut mint_count = 0;
        let mut burn_count= 0;
        let mut trsfr_count= 0;
        let mut approve_count= 0;
        for cnk in cot {
            mint_count += cnk.mint_count;
            burn_count += cnk.burn_count;
            trsfr_count += cnk.transfer_count;
            approve_count += cnk.approve_count;
        }
        let total_cnk = mint_count + burn_count + trsfr_count + approve_count;
        assert_eq!(total_cnk, 31); // all txs accounted for
    }

    #[test]
    fn test_top_by_value(){
        let txs = ptx_test_data();
        let mut trsf: Vec<ProcessedTX> = Vec::new();
        for tx in txs {
            if tx.tx_type == "Transfer" {
                trsf.push(tx);
            }
        }
        let top = top_x_by_txvalue(trsf,5);

        assert_eq!(top[0].tx_value, 500000000);
        assert_eq!(top[1].tx_value, 100000000);
        assert_eq!(top[2].tx_value, 100000000);
        assert_eq!(top[3].tx_value, 80000000);
        assert_eq!(top[4].tx_value, 30000000);
    }
}