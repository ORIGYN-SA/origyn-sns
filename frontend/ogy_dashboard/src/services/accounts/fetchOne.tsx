import { keepPreviousData } from "@tanstack/react-query";
import icrcAPI from "@services/_api/icrc/v1";

const LEDGER_CANISTER_ID = import.meta.env.VITE_LEDGER_CANISTER_ID;

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

export interface FetchOneAccountParams {
  id: string | undefined;
}

const fn = async ({ id }: FetchOneAccountParams): Promise<Account> => {
  const { data } = await icrcAPI.get(
    `/ledgers/${LEDGER_CANISTER_ID}/accounts/${id}`
  );
  return data ?? null;
};

const fetchOneAccount = ({ id = undefined }: FetchOneAccountParams) => {
  return {
    queryKey: ["fetchOneAccount", id],
    queryFn: async () => fn({ id }),
    placeholderData: keepPreviousData,
    enabled: !!id,
  };
};

export default fetchOneAccount;
