import {
  UseQueryOptions,
  FetchQueryOptions,
  keepPreviousData,
} from "@tanstack/react-query";
import ogyAPI from "@services/api/ogy";

export interface Price {
  ogyPrice: number;
  ogyIcpPrice: number;
}

// export interface PriceParams {
//   id: string | undefined;
// }

const fn = async (): Promise<Price> => {
  const { data } = await ogyAPI.get(`/price`);
  return data ?? null;
};

const setBalanceOGY = (options?: UseQueryOptions) => {
  return {
    queryKey: ["fetchOGYPrice"],
    queryFn: fn(),
    placeholderData: keepPreviousData,
    ...options,
  } as FetchQueryOptions;
};

export default setBalanceOGY;
