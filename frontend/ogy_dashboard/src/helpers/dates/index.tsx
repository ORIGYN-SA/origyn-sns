import { DateTime } from "luxon";

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

export const formatDateShort = (date: string) => {
  const datetime = DateTime.fromISO(date);
  return datetime.toLocaleString(DateTime.DATETIME_SHORT);
};

export const timestampToDateShort = (timestamp: number) => {
  const millisecondsTimestamp = timestamp / 1000000;
  const datetime = DateTime.fromMillis(millisecondsTimestamp);
  return datetime.toLocaleString(DateTime.DATETIME_SHORT);
};
