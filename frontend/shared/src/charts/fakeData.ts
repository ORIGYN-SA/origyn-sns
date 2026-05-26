import { FAKE_STAT_VALUE } from "../lib/format";
import type { PieChartData } from "./Pie";

// Skeleton placeholder series shown under the SkeletonOverlay while data loads.
export const FAKE_AREA_SERIES: { name: string; value: number }[] = [
  { name: "Jan", value: 10 },
  { name: "Feb", value: 14 },
  { name: "Mar", value: 12 },
  { name: "Apr", value: 18 },
  { name: "May", value: 22 },
  { name: "Jun", value: 19 },
  { name: "Jul", value: 25 },
  { name: "Aug", value: 28 },
  { name: "Sep", value: 24 },
  { name: "Oct", value: 30 },
  { name: "Nov", value: 34 },
  { name: "Dec", value: 38 },
];

export const FAKE_PIE_SERIES: PieChartData[] = [
  { name: "Segment A", value: 40, valueToString: FAKE_STAT_VALUE },
  { name: "Segment B", value: 35, valueToString: FAKE_STAT_VALUE },
  { name: "Segment C", value: 25, valueToString: FAKE_STAT_VALUE },
];
