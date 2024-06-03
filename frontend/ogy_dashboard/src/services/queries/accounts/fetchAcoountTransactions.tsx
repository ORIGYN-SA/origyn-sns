import {
    UseQueryOptions,
    FetchQueryOptions,
    keepPreviousData,
  } from "@tanstack/react-query";
  import icrcAPI from "@services/api/icrc/v1";
  import { SNS_LEDGER_CANISTER_ID } from "@constants/index";
  import { transformTimeSeriesToBarChartData } from "@helpers/charts/index";
  import { ChartData } from "@services/types/charts.types";
  
  export interface AccountTransactionsParams {
    options?: UseQueryOptions;
    accountPrincipal?: string | null; // princiapal string
  }
  
  export interface AccountTransactions {
    totalSupplyOGYTimeSeries: ChartData[];
  }
  
  const fn = async ({
    accountPrincipal,
  }: AccountTransactionsParams): Promise<any> => {
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
  