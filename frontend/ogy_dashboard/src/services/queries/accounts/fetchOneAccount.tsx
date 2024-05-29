import icrcAPI from "@services/api/icrc/v1";
import { SNS_LEDGER_CANISTER_ID } from "@constants/index";

export interface Account {
  id: string | null;
  owner: string;
  subaccount: string;
  balance: string;
  total_transactions: number;
  created_timestamp: number;
  latest_transaction_index: number;
  updated_at: string;
}

export const fetchOneAccount = async ({
  accountId,
}: {
  accountId: string;
}): Promise<Account> => {
  const { data } = await icrcAPI.get(
    `/ledgers/${SNS_LEDGER_CANISTER_ID}/accounts/${accountId}`
  );
  return data;
};
