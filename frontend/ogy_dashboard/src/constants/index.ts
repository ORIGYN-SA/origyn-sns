export const SNS_LEDGER_CANISTER_ID = import.meta.env
  .VITE_SNS_LEDGER_CANISTER_ID;
export const ICP_LEDGER_CANISTER_ID = import.meta.env
  .VITE_ICP_LEDGER_CANISTER_ID;
export const SNS_GOVERNANCE_CANISTER_ID = import.meta.env
  .VITE_SNS_GOVERNANCE_CANISTER_ID;
export const TOKEN_METRICS_CANISTER_ID = import.meta.env
  .VITE_TOKEN_METRICS_CANISTER_ID;
export const OGY_TOKEN_SWAP_CANISTER_ID = import.meta.env
  .VITE_OGY_TOKEN_SWAP_CANISTER_ID;
export const SNS_REWARDS_CANISTER_ID = import.meta.env
  .VITE_SNS_REWARDS_CANISTER_ID;
export const SNS_ROOT_CANISTER = import.meta.env.VITE_SNS_ROOT_CANISTER;
export const TOKEN_STATS_CANISTER_ID = import.meta.env
  .VITE_TOKEN_STATS_CANISTER_ID;
export const LEGACY_LEDGER_CANISTER_ID = import.meta.env
  .VITE_LEGACY_LEDGER_CANISTER_ID;
export const LEGACY_GOVERNANCE_CANISTER_ID = import.meta.env
  .VITE_LEGACY_GOVERNANCE_CANISTER_ID;
export const LEGACY_VESTING_CANISTER_ID = import.meta.env
  .VITE_LEGACY_VESTING_CANISTER_ID;
export const API_ICRC_V1_BASE_URL = import.meta.env.VITE_API_ICRC_V1_BASE_URL;
export const API_PLAUSIBLE_BASE_URL = import.meta.env
  .VITE_API_PLAUSIBLE_BASE_URL;
export const API_OGY_BASE_URL = import.meta.env.VITE_API_OGY_BASE_URL;
export const API_SNS_BASE_URL = import.meta.env.VITE_API_SNS_BASE_URL;
export const API_LEDGER_BASE_URL = import.meta.env.VITE_API_LEDGER_BASE_URL;
export const API_ROSETTA = import.meta.env.VITE_API_ROSETTA;
export const PLAUSIBLE_API_KEY = import.meta.env.VITE_PLAUSIBLE_API_KEY;
export const ACCOUNT_ID_LEDGER_ICP = import.meta.env.VITE_ACCOUNT_ID_LEDGER_ICP;
export const ACCOUNT_ID_LEDGER_ICP_OLD = import.meta.env
  .VITE_ACCOUNT_ID_LEDGER_ICP_OLD;
export const ACCOUNT_ID_LEDGER_OGY = import.meta.env.VITE_ACCOUNT_ID_LEDGER_OGY;
export const NNS_PLATFORM_URL = import.meta.env.VITE_NNS_PLATFORM_URL;
export const LEGACY_OGY_DASHBOARD_URL = import.meta.env
  .VITE_LEGACY_OGY_DASHBOARD_URL;
export const APP_MODE = import.meta.env.MODE;
export const TRANSACTION_FEE = BigInt(import.meta.env.VITE_TRANSACTION_FEE);
export const TRANSACTION_FEE_ICP = import.meta.env.VITE_TRANSACTION_FEE_ICP;

export const ORIGYN_ACCOUNTS = [
  {
    name: "ORIGYN Foundation",
    value: "7xc7u-onriy-z2gvh-scsnt-sf3gz-ywjyk-sx2sx-uzqyk-3ugdz-lm7xe-5qe",
  },
  {
    name: "ORIGYN Foundation",
    value: "ud7qh-vnh3c-krx66-e2fqy-saxxx-bdyno-2znkq-n5ivx-xeoc6-eygrq-nqe",
  },
  {
    name: "Founder 1",
    value: "vinvi-plqfi-kzczp-gshps-rmjwu-udwrg-gcgxz-i2xlz-2jfln-gzhws-vae",
  },
  {
    name: "Founder 1",
    value: "q7oeg-2audd-xb44f-du5wn-ffclb-ny45c-bevai-pww3z-vtn3c-viynm-oqe",
  },
  {
    name: "Founder 2",
    value: "xjx44-sjcsp-gno44-v6s3r-rnuxq-ukogv-vyqnm-srpd3-wpq5r-kysnb-4qe",
  },
  {
    name: "Founder 3",
    value: "flbgt-g5o2b-dusvz-om3pi-xn6lf-ycqbi-4poz7-2bf2s-aorzv-kga7f-zqe",
  },
  {
    name: "Founder 3",
    value: "zsabt-2p6xo-devrd-asmls-y6r5k-t3lr3-54qo7-66e35-havqy-7jhx3-sqe",
  },
  {
    name: "ORIGYN Ecosystem Fund",
    value: "uqp7y-4u4ux-6rmlk-cnwcb-qggwx-x2vw2-q6ect-ulyfd-ivt5u-3uqfa-mqe",
  },
  {
    name: "Cecil DAO Neuron",
    value: "itz44-maaaa-aaaae-qcszq-cai",
  },
  {
    name: "ORIGYN Operational Wallet",
    value: "qlqay-cvxyu-k4xzq-ppa5v-2zabq-wmkpe-auxpy-kwels-lkep4-jy462-jqe",
  },
  {
    name: "ORIGYN Operational Wallet",
    value: "25v3h-aoa5w-4sjgu-qa34v-qvmq5-q5vbl-lrbeb-arn57-lnslo-uxso7-pae",
  },
  {
    name: "ORIGYN Integrator Wallet",
    value: "unz2d-kv2kp-ntszz-xasw2-oy7yi-wbz4q-aoj2i-ip7d4-filfd-fxd45-gae",
  },
  {
    name: "ORIGYN Rewards and Treasury Account (ORA + OTA)",
    value: "yuijc-oiaaa-aaaap-ahezq-cai",
  },
  {
    name: "OGY Token Migration Canister",
    value: "gzcjd-xiaaa-aaaak-qijga-cai",
  },
  { name: "Gold DAO", value: "54vkq-taaaa-aaaap-ahqra-cai" },
  // {name: "BFS", value: "3rzb3-4q77v-bkng4-khvjp-bf4aj-lvalh-ddend-svbfw-fhort-z64lm-3ae"},
];

if (!(APP_MODE === "production")) {
  console.log(`APP_MODE=${APP_MODE}`);

  if (!SNS_LEDGER_CANISTER_ID)
    console.log(
      "No SNS_LEDGER_CANISTER_ID environment variable. Set SNS_LEDGER_CANISTER_ID environment variable."
    );
  else console.log(`SNS_LEDGER_CANISTER_ID=${SNS_LEDGER_CANISTER_ID}`);

  if (!ICP_LEDGER_CANISTER_ID)
    console.log(
      "No ICP_LEDGER_CANISTER_ID environment variable. Set ICP_LEDGER_CANISTER_ID environment variable."
    );
  else console.log(`ICP_LEDGER_CANISTER_ID=${ICP_LEDGER_CANISTER_ID}`);

  if (!SNS_GOVERNANCE_CANISTER_ID)
    console.log(
      "No SNS_GOVERNANCE_CANISTER_ID environment variable. Set SNS_GOVERNANCE_CANISTER_ID environment variable."
    );
  else console.log(`SNS_GOVERNANCE_CANISTER_ID=${SNS_GOVERNANCE_CANISTER_ID}`);

  if (!TOKEN_METRICS_CANISTER_ID)
    console.log(
      "No TOKEN_METRICS_CANISTER_ID environment variable. Set TOKEN_METRICS_CANISTER_ID environment variable."
    );
  else console.log(`TOKEN_METRICS_CANISTER_ID=${TOKEN_METRICS_CANISTER_ID}`);

  if (!OGY_TOKEN_SWAP_CANISTER_ID)
    console.log(
      "No OGY_TOKEN_SWAP_CANISTER_ID environment variable. Set OGY_TOKEN_SWAP_CANISTER_ID environment variable."
    );
  else console.log(`OGY_TOKEN_SWAP_CANISTER_ID=${OGY_TOKEN_SWAP_CANISTER_ID}`);

  if (!SNS_REWARDS_CANISTER_ID)
    console.log(
      "No SNS_REWARDS_CANISTER_ID environment variable. Set SNS_REWARDS_CANISTER_ID environment variable."
    );
  else console.log(`SNS_REWARDS_CANISTER_ID=${SNS_REWARDS_CANISTER_ID}`);

  if (!SNS_ROOT_CANISTER)
    console.log(
      "No SNS_ROOT_CANISTER environment variable. Set SNS_ROOT_CANISTER environment variable."
    );
  else console.log(`SNS_ROOT_CANISTER=${SNS_ROOT_CANISTER}`);

  if (!LEGACY_LEDGER_CANISTER_ID)
    console.log(
      "No LEGACY_LEDGER_CANISTER_ID environment variable. Set LEGACY_LEDGER_CANISTER_ID environment variable."
    );
  else console.log(`LEGACY_LEDGER_CANISTER_ID=${LEGACY_LEDGER_CANISTER_ID}`);

  if (!LEGACY_GOVERNANCE_CANISTER_ID)
    console.log(
      "No LEGACY_GOVERNANCE_CANISTER_ID environment variable. Set LEGACY_GOVERNANCE_CANISTER_ID environment variable."
    );
  else
    console.log(
      `LEGACY_GOVERNANCE_CANISTER_ID=${LEGACY_GOVERNANCE_CANISTER_ID}`
    );

  if (!LEGACY_VESTING_CANISTER_ID)
    console.log(
      "No LEGACY_VESTING_CANISTER_ID environment variable. Set LEGACY_VESTING_CANISTER_ID environment variable."
    );
  else console.log(`LEGACY_VESTING_CANISTER_ID=${LEGACY_VESTING_CANISTER_ID}`);

  if (!TOKEN_STATS_CANISTER_ID)
    console.log(
      "No TOKEN_STATS_CANISTER_ID environment variable. Set TOKEN_STATS_CANISTER_ID environment variable."
    );
  else console.log(`TOKEN_STATS_CANISTER_ID=${TOKEN_STATS_CANISTER_ID}`);

  if (!API_ICRC_V1_BASE_URL)
    console.log(
      "No API_ICRC_V1_BASE_URL environment variable. Set API_ICRC_V1_BASE_URL environment variable."
    );
  else console.log(`API_ICRC_V1_BASE_URL=${API_ICRC_V1_BASE_URL}`);

  if (!API_OGY_BASE_URL)
    console.log(
      "No API_OGY_BASE_URL environment variable. Set API_OGY_BASE_URL environment variable."
    );
  else console.log(`API_OGY_BASE_URL=${API_OGY_BASE_URL}`);

  if (!API_SNS_BASE_URL)
    console.log(
      "No API_SNS_BASE_URL environment variable. Set API_SNS_BASE_URL environment variable."
    );
  else console.log(`API_SNS_BASE_URL=${API_SNS_BASE_URL}`);

  if (!API_LEDGER_BASE_URL)
    console.log(
      "No API_LEDGER_BASE_URL environment variable. Set API_LEDGER_BASE_URL environment variable."
    );
  else console.log(`API_LEDGER_BASE_URL=${API_LEDGER_BASE_URL}`);

  if (!API_ROSETTA)
    console.log(
      "No API_ROSETTA environment variable. Set API_ROSETTA environment variable."
    );
  else console.log(`API_ROSETTA=${API_ROSETTA}`);

  if (!ACCOUNT_ID_LEDGER_ICP)
    console.log(
      "No ACCOUNT_ID_LEDGER_ICP environment variable. Set ACCOUNT_ID_LEDGER_ICP environment variable."
    );
  else console.log(`ACCOUNT_ID_LEDGER_ICP=${ACCOUNT_ID_LEDGER_ICP}`);

  if (!ACCOUNT_ID_LEDGER_ICP_OLD)
    console.log(
      "No ACCOUNT_ID_LEDGER_ICP_OLD environment variable. Set ACCOUNT_ID_LEDGER_ICP_OLD environment variable."
    );
  else console.log(`ACCOUNT_ID_LEDGER_ICP_OLD=${ACCOUNT_ID_LEDGER_ICP_OLD}`);

  if (!ACCOUNT_ID_LEDGER_OGY)
    console.log(
      "No ACCOUNT_ID_LEDGER_OGY environment variable. Set ACCOUNT_ID_LEDGER_OGY environment variable."
    );
  else console.log(`ACCOUNT_ID_LEDGER_OGY=${ACCOUNT_ID_LEDGER_OGY}`);

  if (!NNS_PLATFORM_URL)
    console.log(
      "No NNS_PLATFORM_URL environment variable. Set NNS_PLATFORM_URL environment variable."
    );
  else console.log(`NNS_PLATFORM_URL=${NNS_PLATFORM_URL}`);

  if (!LEGACY_OGY_DASHBOARD_URL)
    console.log(
      "No LEGACY_OGY_DASHBOARD_URL environment variable. Set LEGACY_OGY_DASHBOARD_URL environment variable."
    );
  else console.log(`LEGACY_OGY_DASHBOARD_URL=${LEGACY_OGY_DASHBOARD_URL}`);

  if (!TRANSACTION_FEE)
    console.log(
      "No TRANSACTION_FEE environment variable. Set TRANSACTION_FEE environment variable."
    );
  else console.log(`TRANSACTION_FEE=${TRANSACTION_FEE}`);

  if (!TRANSACTION_FEE_ICP)
    console.log(
      "No TRANSACTION_FEE_ICP environment variable. Set TRANSACTION_FEE_ICP environment variable."
    );
  else console.log(`TRANSACTION_FEE_ICP=${TRANSACTION_FEE_ICP}`);

  if (!PLAUSIBLE_API_KEY)
    console.log(
      "No PLAUSIBLE_API_KEY environment variable. Set PLAUSIBLE_API_KEY environment variable."
    );
  else console.log(`PLAUSIBLE_API_KEY=${PLAUSIBLE_API_KEY}`);
}
