import icrcAPI from "@services/api/icrc/v1";
import { ListParams } from "@services/types/list.params.types";
import { Transaction } from "@services/types/transactions.types";
import { SNS_LEDGER_CANISTER_ID } from "@constants/index";

export const fetchAllTransactions = async ({
  limit,
  offset,
  sorting,
}: ListParams): Promise<{
  data: Transaction[];
  total_transactions: number;
}> => {
  const { id, desc } = sorting[0];
  const sort = desc ? `&sort_by=-${id}` : `&sort_by=${id}`;
  const { data } = await icrcAPI.get(
    `/ledgers/${SNS_LEDGER_CANISTER_ID}/transactions?limit=${limit}&offset=${offset}${sort}`
  );
  return data;
};
