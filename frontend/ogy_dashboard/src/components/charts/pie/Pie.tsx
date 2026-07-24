// The pie chart now lives in the shared workspace. This file is kept as a thin
// re-export so existing imports (the `PieChartData` type used by the metric
// hooks and skeleton fakeData) keep resolving from "@components/charts/pie/Pie".
export { PieChart as default, type PieChartData } from "@origyn/shared-ui/charts";
