import { ActorSubclass } from "@dfinity/agent";
import {
  UseQueryOptions,
  FetchQueryOptions,
  keepPreviousData,
} from "@tanstack/react-query";

export interface AccountBalanceHistoryParams {
  account: string;
  options?: UseQueryOptions;
  actor: ActorSubclass;
}

const fn = async (account: string, actor: ActorSubclass) => {
  const data = await actor.get_principal_history({days: 30, account});
  return data;
};

const fetchAccountBalanceHistoryQuery = ({account, actor, options }: AccountBalanceHistoryParams) => {
  return {
    queryKey: ["fetchAccountBalanceHistory"],
    queryFn: async () => fn(account, actor),
    placeholderData: keepPreviousData,
    ...options,
  } as FetchQueryOptions;
};

export default fetchAccountBalanceHistoryQuery;
