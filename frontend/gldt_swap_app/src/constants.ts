export const APP_MODE = import.meta.env.MODE;
export const GLD_NFT_1G_CANISTER_ID = import.meta.env
  .VITE_GLD_NFT_1G_CANISTER_ID;
export const GLD_NFT_10G_CANISTER_ID = import.meta.env
  .VITE_GLD_NFT_10G_CANISTER_ID;
export const GLD_NFT_100G_CANISTER_ID = import.meta.env
  .VITE_GLD_NFT_100G_CANISTER_ID;
export const GLD_NFT_1000G_CANISTER_ID = import.meta.env
  .VITE_GLD_NFT_1000G_CANISTER_ID;
export const OGY_LEDGER_CANISTER_ID = import.meta.env
  .VITE_OGY_LEDGER_CANISTER_ID;
export const SWAP_CANISTER_ID = import.meta.env.VITE_SWAP_CANISTER_ID;
export const GLDT_LEDGER_CANISTER_ID = import.meta.env
  .VITE_GLDT_LEDGER_CANISTER_ID;
export const GLDT_LEDGER_INDEXER_CANISTER_ID = import.meta.env
  .VITE_GLDT_LEDGER_INDEXER_CANISTER_ID;
export const GOLD_API_BASE_URL = import.meta.env.VITE_GOLD_API_BASE_URL;
export const GLDT_API_BASE_URL = import.meta.env.VITE_GLDT_API_BASE_URL;

export const OGY_TX_FEE = 200000
export const GLDT_TX_FEE = 10000000;
export const GLDT_DECIMAL = 100000000;
export const REVERSE_GLDT_TX_FEE = 100000000;
export const GLDT_VALUE_1G_NFT = 100;

if (!(APP_MODE === "production")) {
  console.log(`APP_MODE=${APP_MODE}`);

  if (!GOLD_API_BASE_URL)
    console.log(
      "No GOLD_API_BASE_URL environment variable. Set GOLD_API_BASE_URL environment variable."
    );
  else console.log(`GOLD_API_BASE_URL=${GOLD_API_BASE_URL}`);

  if (!GLD_NFT_1G_CANISTER_ID)
    console.log(
      "No GLD_NFT_1G_CANISTER_ID environment variable. Set GLD_NFT_1G_CANISTER_ID environment variable."
    );
  else console.log(`GLD_NFT_1G_CANISTER_ID=${GLD_NFT_1G_CANISTER_ID}`);

  if (!GLD_NFT_10G_CANISTER_ID)
    console.log(
      "No GLD_NFT_10G_CANISTER_ID environment variable. Set GLD_NFT_10G_CANISTER_ID environment variable."
    );
  else console.log(`GLD_NFT_10G_CANISTER_ID=${GLD_NFT_10G_CANISTER_ID}`);

  if (!GLD_NFT_100G_CANISTER_ID)
    console.log(
      "No GLD_NFT_100G_CANISTER_ID environment variable. Set GLD_NFT_100G_CANISTER_ID environment variable."
    );
  else console.log(`GLD_NFT_100G_CANISTER_ID=${GLD_NFT_100G_CANISTER_ID}`);

  if (!GLD_NFT_1000G_CANISTER_ID)
    console.log(
      "No GLD_NFT_1000G_CANISTER_ID environment variable. Set GLD_NFT_1000G_CANISTER_ID environment variable."
    );
  else console.log(`GLD_NFT_1000G_CANISTER_ID=${GLD_NFT_1000G_CANISTER_ID}`);

  if (!OGY_LEDGER_CANISTER_ID)
    console.log(
      "No OGY_LEDGER_CANISTER_ID environment variable. Set OGY_LEDGER_CANISTER_ID environment variable."
    );
  else console.log(`OGY_LEDGER_CANISTER_ID=${OGY_LEDGER_CANISTER_ID}`);

  if (!SWAP_CANISTER_ID)
    console.log(
      "No SWAP_CANISTER_ID environment variable. Set SWAP_CANISTER_ID environment variable."
    );
  else console.log(`SWAP_CANISTER_ID=${SWAP_CANISTER_ID}`);

  if (!GLDT_LEDGER_CANISTER_ID)
    console.log(
      "No GLDT_LEDGER_CANISTER_ID environment variable. Set GLDT_LEDGER_CANISTER_ID environment variable."
    );
  else console.log(`GLDT_LEDGER_CANISTER_ID=${GLDT_LEDGER_CANISTER_ID}`);

  if (!GLDT_LEDGER_INDEXER_CANISTER_ID)
    console.log(
      "No GLDT_LEDGER_INDEXER_CANISTER_ID environment variable. Set GLDT_LEDGER_INDEXER_CANISTER_ID environment variable."
    );
  else console.log(`GLDT_LEDGER_INDEXER_CANISTER_ID=${GLDT_LEDGER_INDEXER_CANISTER_ID}`);

  if (!GLDT_API_BASE_URL)
    console.log(
      "No GLDT_API_BASE_URL environment variable. Set GLDT_API_BASE_URL environment variable."
    );
  else console.log(`GLDT_API_BASE_URL=${GLDT_API_BASE_URL}`);

}
// The ICP ledger and its index are the same on every network the app is built for.
export const ICP_LEDGER_CANISTER_ID = "ryjl3-tyaaa-aaaaa-aaaba-cai";
export const ICP_INDEX_CANISTER_ID = "qhbym-qaaaa-aaaaa-aaafq-cai";
// WalletConnect (Reown) project for gldt.org; empty until one is set in the build's .env.
export const REOWN_PROJECT_ID: string = import.meta.env.VITE_REOWN_PROJECT_ID ?? "";

/** The origin Internet Identity and NFID derive principals from, so several URLs of the app share
 * one principal per user. It must list each of those URLs in its
 * /.well-known/ii-alternative-origins. Unset: the page's own origin. */
export const II_DERIVATION_ORIGIN: string | undefined = import.meta.env.VITE_II_DERIVATION_ORIGIN || undefined;
// The GLD NFT collections' block indexers (ICRC-3 history per account).
export const GLD_NFT_1G_INDEXER_CANISTER_ID: string = import.meta.env.VITE_GLD_NFT_1G_INDEXER_CANISTER_ID;
export const GLD_NFT_10G_INDEXER_CANISTER_ID: string = import.meta.env.VITE_GLD_NFT_10G_INDEXER_CANISTER_ID;
export const GLD_NFT_100G_INDEXER_CANISTER_ID: string = import.meta.env.VITE_GLD_NFT_100G_INDEXER_CANISTER_ID;
export const GLD_NFT_1000G_INDEXER_CANISTER_ID: string = import.meta.env.VITE_GLD_NFT_1000G_INDEXER_CANISTER_ID;
