import { useQuery, keepPreviousData } from "@tanstack/react-query";
import icrcAPI from "@services/_api/icrc/v1";

const LEDGER_CANISTER_ID = import.meta.env.VITE_LEDGER_CANISTER_ID;

export interface DataTransaction {
  index: number;
  updated_at: Date;
  from_account: string;
  to_account: string;
  amount: string;
  fee: string;
}

interface Transaction {
  rows: DataTransaction[];
  pageCount: number;
  rowCount: number;
}

interface FetchAllTransactionsQueryParams {
  limit: number;
  offset: number;
}

const fn = async ({
  limit,
  offset,
}: FetchAllTransactionsQueryParams): Promise<Transaction> => {
  const { data } = await icrcAPI.get(
    `/ledgers/${LEDGER_CANISTER_ID}/transactions?limit=${limit}&offset=${offset}`
  );

  return {
    rows: data?.data ?? [],
    pageCount: data.total_transactions
      ? Math.ceil(data.total_transactions / limit)
      : 0,
    rowCount: data?.total_transactions ?? 0,
  };
};

const useFetchAllTransactions = ({
  limit = 20,
  offset = 0,
}: FetchAllTransactionsQueryParams) => {
  return useQuery<Transaction, Error>({
    queryKey: ["fetchAllTransactions", limit, offset],
    queryFn: () => fn({ limit, offset }),
    placeholderData: keepPreviousData,
  });
};

export default useFetchAllTransactions;
