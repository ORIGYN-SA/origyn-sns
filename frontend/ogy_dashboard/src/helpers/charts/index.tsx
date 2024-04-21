import { DateTime } from "luxon";
import { divideBy1e8 } from "@helpers/numbers/index";

export const transformTimeSeriesToBarChartData = (arr: []) => {
  return arr.map((subarr: Array<string | number>) => {
    return {
      value: divideBy1e8(Number(subarr[1])),
      name: DateTime.fromSeconds(Number(subarr[0])).toFormat("LLL dd"),
    };
  });
};
