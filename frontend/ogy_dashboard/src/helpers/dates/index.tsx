import { DateTime } from "luxon";

export const getCurrentDateInSeconds = () =>
  Math.floor(DateTime.local().toSeconds()).toString();

export const getCurrentDateLastWeekInSeconds = () =>
  Math.floor(
    DateTime.local()
      .minus({ weeks: 1 })
      .startOf("week")
      .plus({ days: DateTime.local().weekday - 1 })
      .toSeconds()
  ).toString();
