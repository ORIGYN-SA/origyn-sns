import icrcAPI from "@services/api/icrc/v1";
import { Transaction } from "@services/types/transactions.types";
import { SNS_LEDGER_CANISTER_ID } from "@constants/index";

export const fetchOneTransaction = async ({
  transactionId,
}: {
  transactionId: string;
}): Promise<Transaction> => {
  const { data } = await icrcAPI.get(
    `/ledgers/${SNS_LEDGER_CANISTER_ID}/transactions/${transactionId}`
  );
  return data;
};
