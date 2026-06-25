import {
  UseQueryOptions,
  FetchQueryOptions,
  keepPreviousData,
} from "@tanstack/react-query";
import gldtAPI from "@services/api/gldt/v1";
import { gldtTokenPath } from "@services/api/gldt/v1/utils";
import {
  ApiTransaction,
  ApiTransactionsResponse,
} from "@services/api/gldt/v1/types";
import { Transaction as DashboardTransaction } from "@services/types/transactions.types";

export interface AccountTransactionsParams {
  options?: UseQueryOptions<TransactionsDetails>;
  accountPrincipal?: string | null;
}

export interface Transaction extends DashboardTransaction {
  created_at_time: string | null;
  expected_allowance: string | null;
  expires_at: string | null;
  fee_collector_block: string | null;
  from_owner: string;
  from_subaccount: string | null;
  ledger_canister_id: string;
  spender_account: string | null;
  spender_owner: string | null;
  spender_subaccount: string | null;
  to_owner: string;
  to_subaccount: string;
}

export type TransactionsDetails = {
  data: Transaction[];
  total_transactions: number;
};

const MS_TO_NS = 1_000_000n;

const getAccountOwner = (account: string) => account.split(".", 1)[0] ?? "";

const toDashboardTimestamp = (timestampMs: number) =>
  (BigInt(timestampMs) * MS_TO_NS).toString();

const toIsoTimestamp = (timestampMs: number) =>
  new Date(timestampMs).toISOString();

const mapAccountTransaction = (tx: ApiTransaction): Transaction => {
  const fromOwner = getAccountOwner(tx.from_account);
  const toOwner = getAccountOwner(tx.to_account);
  const spenderOwner = tx.spender ? getAccountOwner(tx.spender) : null;

  return {
    amount: tx.value,
    created_at_time: null,
    expected_allowance: null,
    expires_at: null,
    fee: tx.fee ?? "",
    fee_collector_block: null,
    from_account: tx.from_account,
    from_owner: fromOwner,
    from_subaccount: null,
    index: tx.block,
    kind: tx.tx_type.toLowerCase(),
    ledger_canister_id: "",
    memo: "",
    spender_account: tx.spender,
    spender_owner: spenderOwner,
    spender_subaccount: null,
    timestamp: toDashboardTimestamp(tx.tx_time),
    to_account: tx.to_account,
    to_owner: toOwner,
    to_subaccount: "",
    updated_at: toIsoTimestamp(tx.tx_time),
  };
};

const fn = async ({
  accountPrincipal,
}: AccountTransactionsParams): Promise<TransactionsDetails> => {
  const account = accountPrincipal?.trim();

  if (!account) return { data: [], total_transactions: 0 };

  const { data } = await gldtAPI.get<ApiTransactionsResponse>(
    gldtTokenPath("transactions", { account, limit: 100 })
  );

  return {
    total_transactions: data.total_count,
    data: data.data.map(mapAccountTransaction),
  };
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
  } as FetchQueryOptions<TransactionsDetails>;
};

export default fetchAccountTransactions;
