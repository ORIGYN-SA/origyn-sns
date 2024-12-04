import { DateTime } from "luxon";
import { divideBy1e8 } from "@helpers/numbers/index";
import {
  getCurrentDateInSeconds,
  nowMinusOneDayToSeconds,
  nowMinusOneWeekToSeconds,
  nowMinusOneMonthToSeconds,
  nowMinusOneYearToSeconds,
} from "@helpers/dates/index";
import { decodeIcrcAccount, encodeIcrcAccount } from "@dfinity/ledger-icrc";
import { Principal } from "@dfinity/principal";

export interface Period {
  [key: string]: {
    start: string;
    end: string;
    step: number;
    days: number;
  };
}

export const transformTimeSeriesToBarChartData = (arr: []) => {
  return arr.map((subarr: Array<string | number>) => {
    return {
      value: divideBy1e8(Number(subarr[1])),
      name: DateTime.fromSeconds(Number(subarr[0])).toFormat("LLL dd HH:MM"),
    };
  });
};

export const encodeAccount = (account?: string): string => {
  if (!account) return "Unknown";

  try {
    const [owner, subaccount] = account.split(".");
    if (owner === "Token Ledger") return account;
    const result = encodeIcrcAccount({
      owner: Principal.fromText(owner),
      subaccount: subaccount
        ? [...Uint8Array.from(Buffer.from(subaccount, "hex"))]
        : [],
    });
    return result;
  } catch (err) {
    console.error(`Failed to encode account: ${account}`, err);
    return "Invalid account";
  }
};

export const codeAndDecodeAccount = (account: string | undefined): string => {
  if (!account) return "Unknown";
  try {
    const coded = encodeAccount(account);
    const decoded = decodeIcrcAccount(coded);
    const owner = decoded.owner;
    return owner.toString();
  } catch (err) {
    console.error(`Invalid account format: ${account}`, err);
    return "Invalid account";
  }
};

export const timeseriesPeriodOptions = (period: string) => {
  const STEP_HOUR = 600;
  const STEP_DAY = 86400;
  const END = getCurrentDateInSeconds();
  const options: Period = {
    daily: {
      start: nowMinusOneDayToSeconds(),
      end: END,
      step: STEP_HOUR,
      days: 1,
    },
    weekly: {
      start: nowMinusOneWeekToSeconds(),
      end: END,
      step: STEP_HOUR,
      days: 7,
    },
    monthly: {
      start: nowMinusOneMonthToSeconds(),
      end: END,
      step: STEP_DAY,
      days: 30,
    },
    yearly: {
      start: nowMinusOneYearToSeconds(),
      end: END,
      step: STEP_DAY,
      days: 365,
    },
  };
  return options[period];
};
