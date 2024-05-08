export const SNS_LEDGER_CANISTER_ID = import.meta.env.VITE_SNS_LEDGER_CANISTER_ID;
export const SNS_GOVERNANCE_CANISTER_ID = import.meta.env.VITE_SNS_GOVERNANCE_CANISTER_ID;
export const TOKEN_METRICS_CANISTER_ID = import.meta.env.VITE_TOKEN_METRICS_CANISTER_ID;
export const OGY_TOKEN_SWAP_CANISTER_ID = import.meta.env.VITE_OGY_TOKEN_SWAP_CANISTER_ID;
export const SNS_REWARDS_CANISTER_ID = import.meta.env.VITE_SNS_REWARDS_CANISTER_ID;
export const LEGACY_LEDGER_CANISTER_ID = import.meta.env.VITE_LEGACY_LEDGER_CANISTER_ID;
export const LEGACY_GOVERNANCE_CANISTER_ID = import.meta.env.VITE_LEGACY_GOVERNANCE_CANISTER_ID;
export const LEGACY_VESTING_CANISTER_ID = import.meta.env.VITE_LEGACY_VESTING_CANISTER_ID;
export const API_ICRC_V1_BASE_URL = import.meta.env.VITE_API_ICRC_V1_BASE_URL;
export const API_OGY_BASE_URL = import.meta.env.VITE_API_OGY_BASE_URL;
export const NNS_PLATFORM_URL = import.meta.env.VITE_NNS_PLATFORM_URL
export const LEGACY_OGY_DASHBOARD_URL = import.meta.env.VITE_LEGACY_OGY_DASHBOARD_URL
export const APP_MODE = import.meta.env.MODE
export const TRANSACTION_FEE = BigInt(import.meta.env.VITE_TRANSACTION_FEE)

if (!(APP_MODE === "production")) {
    console.log(`APP_MODE=${APP_MODE}`)

    if (!SNS_LEDGER_CANISTER_ID)
        console.log("No SNS_LEDGER_CANISTER_ID environment variable. Set SNS_LEDGER_CANISTER_ID environment variable.")
    else
        console.log(`SNS_LEDGER_CANISTER_ID=${SNS_LEDGER_CANISTER_ID}`)
    
    if (!SNS_GOVERNANCE_CANISTER_ID)
        console.log("No SNS_GOVERNANCE_CANISTER_ID environment variable. Set SNS_GOVERNANCE_CANISTER_ID environment variable.")
    else
        console.log(`SNS_GOVERNANCE_CANISTER_ID=${SNS_GOVERNANCE_CANISTER_ID}`)

    if (!TOKEN_METRICS_CANISTER_ID)
        console.log("No TOKEN_METRICS_CANISTER_ID environment variable. Set TOKEN_METRICS_CANISTER_ID environment variable.")
    else
        console.log(`TOKEN_METRICS_CANISTER_ID=${TOKEN_METRICS_CANISTER_ID}`)

    if (!OGY_TOKEN_SWAP_CANISTER_ID)
        console.log("No OGY_TOKEN_SWAP_CANISTER_ID environment variable. Set OGY_TOKEN_SWAP_CANISTER_ID environment variable.")
    else
        console.log(`OGY_TOKEN_SWAP_CANISTER_ID=${OGY_TOKEN_SWAP_CANISTER_ID}`)
    
    if (!SNS_REWARDS_CANISTER_ID)
        console.log("No SNS_REWARDS_CANISTER_ID environment variable. Set SNS_REWARDS_CANISTER_ID environment variable.")
    else
        console.log(`SNS_REWARDS_CANISTER_ID=${SNS_REWARDS_CANISTER_ID}`)
    
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

    if (!TRANSACTION_FEE)
        console.log("No TRANSACTION_FEE environment variable. Set TRANSACTION_FEE environment variable.")
    else
        console.log(`TRANSACTION_FEE=${TRANSACTION_FEE}`)
}
