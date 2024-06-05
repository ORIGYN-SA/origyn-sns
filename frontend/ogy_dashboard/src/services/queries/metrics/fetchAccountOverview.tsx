import { ActorSubclass } from "@dfinity/agent";
import {
  UseQueryOptions,
  FetchQueryOptions,
  keepPreviousData,
} from "@tanstack/react-query";

export interface AccountOverviewParams {
  account: string;
  options?: UseQueryOptions;
  actor: ActorSubclass;
}

const fn = async (account: string, actor: ActorSubclass) => {
  const data = await actor.get_principal_overview(account);
  return data;
};

const fetchAccountOverview = ({account, actor, options }: AccountOverviewParams) => {
  return {
    queryKey: ["fetchAccountOverview"],
    queryFn: async () => fn(account, actor),
    placeholderData: keepPreviousData,
    ...options,
  } as FetchQueryOptions;
};

export default fetchAccountOverview;
