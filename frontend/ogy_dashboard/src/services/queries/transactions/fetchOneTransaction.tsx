import icrcAPI from "@services/api/icrc/v1";
import { SNS_LEDGER_CANISTER_ID } from "@constants/index";

export interface Transaction {
  index: number;
  updated_at: string;
  from_account: string;
  to_account: string;
  amount: string;
  fee: string;
  memo: string;
  kind: string;
}

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
