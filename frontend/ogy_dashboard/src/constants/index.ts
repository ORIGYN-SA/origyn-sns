export const LEDGER_CANISTER_ID = import.meta.env.VITE_LEDGER_CANISTER_ID;
export const GOVERNANCE_CANISTER_ID = import.meta.env.VITE_GOVERNANCE_CANISTER_ID;
export const TOKEN_METRICS_CANISTER_ID = import.meta.env.VITE_TOKEN_METRICS_CANISTER_ID;
export const LEGACY_LEDGER_CANISTER_ID = import.meta.env.VITE_LEGACY_LEDGER_CANISTER_ID;
export const LEGACY_GOVERNANCE_CANISTER_ID = import.meta.env.VITE_LEGACY_GOVERNANCE_CANISTER_ID;
export const LEGACY_VESTING_CANISTER_ID = import.meta.env.VITE_LEGACY_VESTING_CANISTER_ID;
export const API_ICRC_V1_BASE_URL = import.meta.env.VITE_API_ICRC_V1_BASE_URL;
export const API_OGY_BASE_URL = import.meta.env.VITE_API_OGY_BASE_URL;
export const NNS_PLATFORM_URL = import.meta.env.VITE_NNS_PLATFORM_URL
export const LEGACY_OGY_DASHBOARD_URL = import.meta.env.VITE_LEGACY_OGY_DASHBOARD_URL
export const APP_MODE = import.meta.env.MODE

if (!(APP_MODE === "production")) {
    console.log(`APP_MODE=${APP_MODE}`)

    if (!LEDGER_CANISTER_ID)
        console.log("No LEDGER_CANISTER_ID environment variable. Set LEDGER_CANISTER_ID environment variable.")
    else
        console.log(`LEDGER_CANISTER_ID=${LEDGER_CANISTER_ID}`)
    
    if (!GOVERNANCE_CANISTER_ID)
        console.log("No GOVERNANCE_CANISTER_ID environment variable. Set GOVERNANCE_CANISTER_ID environment variable.")
    else
        console.log(`GOVERNANCE_CANISTER_ID=${GOVERNANCE_CANISTER_ID}`)

    if (!TOKEN_METRICS_CANISTER_ID)
        console.log("No TOKEN_METRICS_CANISTER_ID environment variable. Set TOKEN_METRICS_CANISTER_ID environment variable.")
    else
        console.log(`TOKEN_METRICS_CANISTER_ID=${TOKEN_METRICS_CANISTER_ID}`)
    
    if (!LEGACY_LEDGER_CANISTER_ID)
        console.log("No LEGACY_LEDGER_CANISTER_ID environment variable. Set LEGACY_LEDGER_CANISTER_ID environment variable.")
    else
        console.log(`LEGACY_LEDGER_CANISTER_ID=${LEGACY_LEDGER_CANISTER_ID}`)
    
    if (!LEGACY_GOVERNANCE_CANISTER_ID)
        console.log("No LEGACY_GOVERNANCE_CANISTER_ID environment variable. Set LEGACY_GOVERNANCE_CANISTER_ID environment variable.")
    else
        console.log(`LEGACY_GOVERNANCE_CANISTER_ID=${LEGACY_GOVERNANCE_CANISTER_ID}`)
    
    if (!LEGACY_VESTING_CANISTER_ID)
        console.log("No LEGACY_VESTING_CANISTER_ID environment variable. Set LEGACY_VESTING_CANISTER_ID environment variable.")
    else
        console.log(`LEGACY_VESTING_CANISTER_ID=${LEGACY_VESTING_CANISTER_ID}`)
    
    if (!API_ICRC_V1_BASE_URL)
        console.log("No API_ICRC_V1_BASE_URL environment variable. Set API_ICRC_V1_BASE_URL environment variable.")
    else
        console.log(`API_ICRC_V1_BASE_URL=${API_ICRC_V1_BASE_URL}`)
    
    if (!API_OGY_BASE_URL)
        console.log("No API_OGY_BASE_URL environment variable. Set API_OGY_BASE_URL environment variable.")
    else
        console.log(`API_OGY_BASE_URL=${API_OGY_BASE_URL}`)
    
    if (!NNS_PLATFORM_URL)
        console.log("No NNS_PLATFORM_URL environment variable. Set NNS_PLATFORM_URL environment variable.")
    else
        console.log(`NNS_PLATFORM_URL=${NNS_PLATFORM_URL}`)

    if (!LEGACY_OGY_DASHBOARD_URL)
        console.log("No LEGACY_OGY_DASHBOARD_URL environment variable. Set LEGACY_OGY_DASHBOARD_URL environment variable.")
    else
        console.log(`LEGACY_OGY_DASHBOARD_URL=${LEGACY_OGY_DASHBOARD_URL}`)
}
