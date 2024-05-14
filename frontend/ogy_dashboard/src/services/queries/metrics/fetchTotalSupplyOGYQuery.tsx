import {
  UseQueryOptions,
  FetchQueryOptions,
  keepPreviousData,
} from "@tanstack/react-query";
import icrcAPI from "@services/api/icrc/v1";
import { SNS_LEDGER_CANISTER_ID } from "@constants/index";
import { divideBy1e8, roundAndFormatLocale } from "@helpers/numbers/index";

export interface TotalSupplyOGY {
  totalSupplyOGY: number;
  totalSupplyOGYToString: string;
}

export interface TotalSupplyOGYParams {
  options?: UseQueryOptions;
}

const fn = async (): Promise<TotalSupplyOGY> => {
  const { data } = await icrcAPI.get(
    `/ledgers/${SNS_LEDGER_CANISTER_ID}/total-supply`
  );

  const totalSupplyOGY = Number(data?.data[0][1]) ?? 0;
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
  } as FetchQueryOptions;
};

export default fetchTotalSupplyOGYQuery;
