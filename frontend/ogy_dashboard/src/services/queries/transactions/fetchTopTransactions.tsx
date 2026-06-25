import gldtAPI from "@services/api/gldt/v1";
import { gldtTokenPath } from "@services/api/gldt/v1/utils";
import { ApiTransactionsResponse } from "@services/api/gldt/v1/types";
import { ProcessedTX } from "@hooks/token_metrics/declarations_files/token_metrics";

const MS_TO_NS = 1_000_000n;

const TYPE_MAP: Record<"transfers" | "burns", string> = {
  transfers: "Transfer",
  burns: "Burn",
};

const fetchTopTransactions = async ({
  type,
  limit = 25,
}: {
  type: "transfers" | "burns";
  limit?: number;
}): Promise<ProcessedTX[]> => {
  const { data } = await gldtAPI.get<ApiTransactionsResponse>(
    gldtTokenPath("transactions", {
      type: TYPE_MAP[type],
      sort_by: "-value",
      limit,
    })
  );
  return data.data.map((tx) => ({
    hash: tx.hash,
    from_account: tx.from_account,
    to_account: tx.to_account,
    block: BigInt(tx.block),
    tx_type: tx.tx_type,
    tx_value: BigInt(tx.value),
    tx_fee: (tx.fee !== null ? [BigInt(tx.fee)] : []) as [] | [bigint],
    tx_time: BigInt(tx.tx_time) * MS_TO_NS,
    spender: (tx.spender !== null ? [tx.spender] : []) as [] | [string],
  }));
};

export default fetchTopTransactions;
