import {
  UseQueryOptions,
  FetchQueryOptions,
  keepPreviousData,
} from "@tanstack/react-query";
import gldtAPI from "@services/api/gldt/v1";
import { gldtTokenPath } from "@services/api/gldt/v1/utils";
import { ApiSupplySummary } from "@services/api/gldt/v1/types";
import { divideBy1e8, roundAndFormatLocale } from "@helpers/numbers/index";

export interface TotalSupplyOGY {
  totalSupplyOGY: number;
  totalSupplyOGYToString: string;
}

export interface TotalSupplyOGYParams {
  options?: UseQueryOptions<TotalSupplyOGY>;
}

const fn = async (): Promise<TotalSupplyOGY> => {
  const { data } = await gldtAPI.get<ApiSupplySummary>(
    gldtTokenPath("supply/summary")
  );
  const totalSupplyOGY = Number(data.total_supply);

  return {
    totalSupplyOGY,
    totalSupplyOGYToString:
      roundAndFormatLocale({
        number: divideBy1e8(totalSupplyOGY),
      }) ?? "0",
  };
};

const fetchTotalSupplyOGYQuery = ({ options }: TotalSupplyOGYParams) => {
  return {
    queryKey: ["fetchTotalSupplyOGY"],
    queryFn: async () => fn(),
    placeholderData: keepPreviousData,
    ...options,
  } as FetchQueryOptions<TotalSupplyOGY>;
};

export default fetchTotalSupplyOGYQuery;
