import { keepPreviousData } from "@tanstack/react-query";
import icrcAPI from "@services/_api/icrc/v1";
import { LEDGER_CANISTER_ID } from "@constants/index";

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

export interface FetchOneTransactionParams {
  index: string | undefined;
}

const fn = async ({
  index,
}: FetchOneTransactionParams): Promise<Transaction> => {
  const { data } = await icrcAPI.get(
    `/ledgers/${LEDGER_CANISTER_ID}/transactions/${index}`
  );
  return data ?? null;
};

const fetchOneTransactionQuery = ({
  index = undefined,
}: FetchOneTransactionParams) => {
  return {
    queryKey: ["fetchOneTransaction", index],
    queryFn: async () => fn({ index }),
    placeholderData: keepPreviousData,
    enabled: !!index,
  };
};

export default fetchOneTransactionQuery;