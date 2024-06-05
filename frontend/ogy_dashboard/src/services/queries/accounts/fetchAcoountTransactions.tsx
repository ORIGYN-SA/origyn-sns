import {
  UseQueryOptions,
  FetchQueryOptions,
  keepPreviousData,
} from "@tanstack/react-query";
import icrcAPI from "@services/api/icrc/v1";
import { SNS_LEDGER_CANISTER_ID } from "@constants/index";
import { ChartData } from "@services/types/charts.types";

export interface AccountTransactionsParams {
  options?: UseQueryOptions;
  accountPrincipal?: string | null; // princiapal string
}

export interface AccountTransactions {
  totalSupplyOGYTimeSeries: ChartData[];
}

export type Transaction = {
  amount: string;
  created_at_time: string | null;
  expected_allowance: string | null;
  expires_at: string | null;
  fee: string;
  fee_collector_block: string | null;
  from_account: string;
  from_owner: string;
  from_subaccount: string | null;
  index: number;
  kind: string;
  ledger_canister_id: string;
  memo: string;
  spender_account: string | null;
  spender_owner: string | null;
  spender_subaccount: string | null;
  timestamp: string;
  to_account: string;
  to_owner: string;
  to_subaccount: string;
  updated_at: string;
}
export type TransactionsDetails = {
  data: Transaction[];
  total_transactions: number;
}

const fn = async ({
  accountPrincipal,
}: AccountTransactionsParams): Promise<TransactionsDetails> => {
  const { data } = await icrcAPI.get(
    `/ledgers/${SNS_LEDGER_CANISTER_ID}/accounts/${accountPrincipal}/transactions`
  );
  return data;
};

const fetchAccountTransactions = ({
  options,
  accountPrincipal = null,
}: AccountTransactionsParams) => {
  return {
    queryKey: ["fetchAccountTransactions", accountPrincipal],
    queryFn: async () => fn({ accountPrincipal }),
    placeholderData: keepPreviousData,
    ...options,
  } as FetchQueryOptions;
};

export default fetchAccountTransactions;
