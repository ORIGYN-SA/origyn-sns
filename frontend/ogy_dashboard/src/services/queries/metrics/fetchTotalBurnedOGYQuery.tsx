import {
  UseQueryOptions,
  FetchQueryOptions,
  keepPreviousData,
} from "@tanstack/react-query";
import icrcAPI from "@services/api/icrc/v1";
import { SNS_LEDGER_CANISTER_ID } from "@constants/index";
import { divideBy1e8, roundAndFormatLocale } from "@helpers/numbers/index";
import { getCurrentDateInSeconds } from "@helpers/dates/index";

export interface TotalBurnedOGY {
  totalBurnedOGY: number;
  totalBurnedOGYToString: string;
}

export interface TotalBurnedOGYParams {
  options?: UseQueryOptions;
}

const fn = async (): Promise<TotalBurnedOGY> => {
  const TIMESTAMP_REFERENCE_LAUNCH_SNS = 1717545600;
  const { data } = await icrcAPI.get(
    `/ledgers/${SNS_LEDGER_CANISTER_ID}/total-burned-per-day?start=${TIMESTAMP_REFERENCE_LAUNCH_SNS}&end=${getCurrentDateInSeconds()}`
  );
  const total = data.data
    .map((d: Array<number>) => Number(d[1]))
    .reduce((accumulator: number, value: number) => {
      return accumulator + value;
    }, 0);

  const totalBurnedOGY = total ?? 0;
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
