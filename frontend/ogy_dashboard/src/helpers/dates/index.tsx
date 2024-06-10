import { DateTime, DurationObjectUnits } from "luxon";

export const getCurrentTimestamp = () =>
  Math.floor(DateTime.local().toSeconds());

export const getCurrentDateInSeconds = () =>
  Math.floor(DateTime.local().toSeconds()).toString();

export const getCurrentDateInNanoseconds = () =>
  DateTime.now().toMillis() * 1000000;

export const getCurrentDateLastWeekInSeconds = () =>
  Math.floor(
    DateTime.local()
      .minus({ weeks: 1 })
      .startOf("week")
      .plus({ days: DateTime.local().weekday - 1 })
      .toSeconds()
  ).toString();

export const getCurrentDateLastMonthInSeconds = () =>
  Math.floor(
    DateTime.local()
      .minus({ months: 1 })
      .startOf("month")
      .plus({ days: DateTime.local().weekday - 1 })
      .toSeconds()
  ).toString();

export const formatDateShort = (date: string) => {
  const datetime = DateTime.fromISO(date);
  return datetime.toLocaleString(DateTime.DATETIME_SHORT);
};

export const timestampToDateShort = (timestamp: number) => {
  const millisecondsTimestamp = timestamp / 1000000;
  const datetime = DateTime.fromMillis(millisecondsTimestamp);
  return datetime.toLocaleString(DateTime.DATETIME_SHORT);
};

export const formatYearsDifference = (timestamp: number) => {
  const givenDate = DateTime.fromSeconds(timestamp);
  const now = DateTime.now();
  const difference = givenDate.diff(now, ["years"]);
  const { years } = difference.toObject();
  const roundedYears = Math.round(years ?? 0);

  return `${roundedYears} year${roundedYears > 1 ? "s" : ""}`;
};

export const formatTimestampDifference = (timestamp: number) => {
  const givenDate = DateTime.fromSeconds(timestamp);
  const now = DateTime.now();
  const difference = now.diff(givenDate, [
    "years",
    "months",
    "days",
    "hours",
    "minutes",
    "seconds",
  ]);

  const units: { unit: keyof DurationObjectUnits; label: string }[] = [
    { unit: "years", label: "Year" },
    { unit: "months", label: "Month" },
    { unit: "days", label: "Day" },
    { unit: "hours", label: "Hour" },
    { unit: "minutes", label: "Minute" },
    { unit: "seconds", label: "Second" },
  ];
  const formattedDifference = units.find(({ unit }) => difference[unit]);
  return formattedDifference
    ? `${difference[formattedDifference.unit]} ${formattedDifference.label}${
        difference[formattedDifference.unit] > 1 ? "s" : ""
      }`
    : "Just now";
};
