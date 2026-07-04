export const SNS_LEDGER_CANISTER_ID = import.meta.env
  .VITE_SNS_LEDGER_CANISTER_ID;
export const ICP_LEDGER_CANISTER_ID = import.meta.env
  .VITE_ICP_LEDGER_CANISTER_ID;
export const SNS_GOVERNANCE_CANISTER_ID = import.meta.env
  .VITE_SNS_GOVERNANCE_CANISTER_ID;
export const OGY_TOKEN_SWAP_CANISTER_ID = import.meta.env
  .VITE_OGY_TOKEN_SWAP_CANISTER_ID;
export const SNS_REWARDS_CANISTER_ID = import.meta.env
  .VITE_SNS_REWARDS_CANISTER_ID;
export const SNS_ROOT_CANISTER = import.meta.env.VITE_SNS_ROOT_CANISTER;
export const LEGACY_LEDGER_CANISTER_ID = import.meta.env
  .VITE_LEGACY_LEDGER_CANISTER_ID;
export const MINTING_STUDIO_CANISTER_ID =
  import.meta.env.VITE_MINTING_STUDIO_CANISTER_ID ??
  "uasjq-dyaaa-aaaas-qdwka-cai";

// ICPSwap mainnet pool canisters (stable; do not vary per env)
export const ICPSWAP_OGY_ICP_POOL_CANISTER_ID = "ttnzy-lyaaa-aaaag-qj2bq-cai";
export const ICPSWAP_ICP_CKUSDC_POOL_CANISTER_ID =
  "mohjv-bqaaa-aaaag-qjyia-cai";
export const API_ICRC_V1_BASE_URL = import.meta.env.VITE_API_ICRC_V1_BASE_URL;
export const API_OGY_BASE_URL = import.meta.env.VITE_API_OGY_BASE_URL;
export const API_SNS_BASE_URL = import.meta.env.VITE_API_SNS_BASE_URL;
export const API_ROSETTA = import.meta.env.VITE_API_ROSETTA;
export const API_GLDT_BASE_URL = import.meta.env.VITE_API_GLDT_BASE_URL;
export const GLDT_API_TOKEN_SYMBOL = "OGY";
// Dataset segment for the GLDT NFT API. Mainnet data lives under "production".
export const GLDT_NFT_ENV = import.meta.env.VITE_GLDT_NFT_ENV ?? "production";
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
