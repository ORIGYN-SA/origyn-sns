import { SortingState } from "@tanstack/react-table";
import { Transaction } from "@services/types/transactions.types";
import { ApiTransaction } from "@services/api/gldt/v1/types";

const MS_TO_NS = 1_000_000n;
const SORT_FIELD_BY_COLUMN_ID: Record<string, string | undefined> = {
  amount: "value",
  index: "time",
  timestamp: "time",
};

export const buildTransactionsSort = (sorting?: SortingState): string => {
  const sort = sorting?.[0];
  if (!sort) return "";
  const field = SORT_FIELD_BY_COLUMN_ID[sort.id];
  if (!field) return "";
  return `${sort.desc ? "-" : ""}${field}`;
};

const toDashboardTimestamp = (txTime: number) =>
  (BigInt(txTime) * MS_TO_NS).toString();

const toIsoTimestamp = (txTime: number) => new Date(txTime).toISOString();

export const mapApiTransaction = (tx: ApiTransaction): Transaction => ({
  index: tx.block,
  timestamp: toDashboardTimestamp(tx.tx_time),
  updated_at: toIsoTimestamp(tx.tx_time),
  from_account: tx.from_account,
  to_account: tx.to_account,
  amount: tx.value,
  fee: tx.fee ?? "",
  memo: "",
  kind: tx.tx_type.toLowerCase(),
});
