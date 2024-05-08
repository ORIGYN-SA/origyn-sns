import {
  UseQueryOptions,
  FetchQueryOptions,
  keepPreviousData,
} from "@tanstack/react-query";
import icrcAPI from "@services/_api/icrc/v1";
import { SNS_LEDGER_CANISTER_ID } from "@constants/index";
import { divideBy1e8, roundAndFormatLocale } from "@helpers/numbers/index";

export interface TotalBurnedOGY {
  totalBurnedOGY: number;
  totalBurnedOGYToString: string;
}

export interface TotalBurnedOGYParams {
  options?: UseQueryOptions;
}

const fn = async (): Promise<TotalBurnedOGY> => {
  const { data } = await icrcAPI.get(
    `/ledgers/${SNS_LEDGER_CANISTER_ID}/total-burned-per-day`
  );

  const totalBurnedOGY = Number(data?.data[0][1]) ?? 0;
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
  } as FetchQueryOptions;
};

export default fetchTotalBurnedOGYQuery;
