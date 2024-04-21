import {
  UseQueryOptions,
  FetchQueryOptions,
  keepPreviousData,
} from "@tanstack/react-query";
import icrcAPI from "@services/_api/icrc/v1";
import { LEDGER_CANISTER_ID } from "@constants/index";

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

export interface AccountParams {
  id: string | undefined;
}

const fn = async ({ id }: AccountParams): Promise<Account> => {
  const { data } = await icrcAPI.get(
    `/ledgers/${LEDGER_CANISTER_ID}/accounts/${id}`
  );
  return data ?? null;
};

const fetchOneAccountQuery = (
  { id = undefined }: AccountParams,
  options?: UseQueryOptions
) => {
  return {
    queryKey: ["fetchOneAccount", id],
    queryFn: fn({ id }),
    placeholderData: keepPreviousData,
    enabled: !!id,
    ...options,
  } as FetchQueryOptions;
};

export default fetchOneAccountQuery;
