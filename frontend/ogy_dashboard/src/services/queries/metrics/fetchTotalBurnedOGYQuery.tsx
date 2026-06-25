import {
  UseQueryOptions,
  FetchQueryOptions,
  keepPreviousData,
} from "@tanstack/react-query";
import { divideBy1e8, roundAndFormatLocale } from "@helpers/numbers/index";
import { fetchSupplyHistoryByGroup } from "@services/queries/metrics/supplyHistory";

export interface TotalBurnedOGY {
  totalBurnedOGY: number;
  totalBurnedOGYToString: string;
}

export interface TotalBurnedOGYParams {
  options?: UseQueryOptions<TotalBurnedOGY>;
}

const fn = async (): Promise<TotalBurnedOGY> => {
  const data = await fetchSupplyHistoryByGroup("year");
  const latest = data[data.length - 1];
  const totalBurnedOGY = latest ? Number(latest.total_burned) : 0;

  return {
    totalBurnedOGY,
    totalBurnedOGYToString:
      roundAndFormatLocale({
        number: divideBy1e8(totalBurnedOGY),
      }) ?? "0",
  };
};

const fetchTotalBurnedOGYQuery = ({ options }: TotalBurnedOGYParams) => {
  return {
    queryKey: ["fetchTotalBurnedOGY"],
    queryFn: async () => fn(),
    placeholderData: keepPreviousData,
    ...options,
  } as FetchQueryOptions<TotalBurnedOGY>;
};

export default fetchTotalBurnedOGYQuery;
