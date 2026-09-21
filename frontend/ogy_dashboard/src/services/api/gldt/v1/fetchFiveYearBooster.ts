import gldtAPI from "./index";
import { gldtTokenPath } from "./utils";

const parseAmount = (value: unknown): bigint => {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    throw new Error("Invalid booster token amount");
  }
  return BigInt(value);
};

const parseDate = (value: unknown): string => {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(Date.parse(value))
  ) {
    throw new Error("Invalid booster round date");
  }
  return value;
};

const fetchFiveYearBooster = async () => {
  const { data } = await gldtAPI.get<unknown>(
    gldtTokenPath("rewards/five-year-booster")
  );
  if (typeof data !== "object" || data === null) {
    throw new Error("Invalid booster response");
  }
  const rate =
    "annualized_bonus_rate_percent" in data
      ? data.annualized_bonus_rate_percent
      : null;
  if (
    rate !== null &&
    (typeof rate !== "number" || !Number.isFinite(rate) || rate < 0)
  ) {
    throw new Error("Invalid booster rate");
  }
  const firstRound = "first_round_date" in data ? data.first_round_date : null;
  if (!("rounds" in data) || !Array.isArray(data.rounds)) {
    throw new Error("Invalid booster payout history");
  }
  const rounds = data.rounds.map((round: unknown) => {
    if (
      typeof round !== "object" ||
      round === null ||
      !("date" in round) ||
      !("amount" in round)
    ) {
      throw new Error("Invalid booster payout round");
    }
    return { date: parseDate(round.date), amount: parseAmount(round.amount) };
  });
  return {
    rounds,
    rate,
    firstRound: firstRound === null ? null : parseDate(firstRound),
    locked: parseAmount(
      "five_year_locked" in data ? data.five_year_locked : undefined
    ),
    paid: parseAmount(
      "cumulative_paid" in data ? data.cumulative_paid : undefined
    ),
  };
};

export default fetchFiveYearBooster;
