// import { useMemo } from "react";
// import { Card, TooltipInfo } from "@components/ui";
// import {
//   Loader as ChartLoader,
//   Error as ChartError,
//   Area as ChartArea,
// } from "@components/charts";
// import useGetActiveAccounts from "@hooks/super_stats_v3/useGetActiveAccounts";

// const ChartActiveAccounts = ({
//   className,
//   ...restProps
// }: {
//   className?: string;
// }) => {
//   const barFill = useMemo(() => "#38bdf8", []);

//   // TODO implement change period (dayly/weekly/monthly...)
//   // const { data, isLoading, isSuccess, isError } = useGetActiveAccounts({
//   //   start: 30,
//   // });
//   useGetActiveAccounts({ start: 30 });

//   return null;
//   // <Card className={`${className}`} {...restProps}>
//   //   <div className="flex items-center justify-between">
//   //     <div className="flex items-center">
//   //       <h2 className="text-lg font-semibold mr-2">
//   //         Governance Staking Overview
//   //       </h2>
//   //     </div>
//   //     {isSuccess && (
//   //       <button className="text-sm font-medium rounded-full px-3 py-1">
//   //         Monthly
//   //       </button>
//   //     )}
//   //   </div>
//   //   {isLoading && <ChartLoader />}
//   //   {isSuccess && (
//   //     <div className="mt-4 grid grid-cols-1 xl:grid-cols-4">
//   //       <div className="col-span-1 flex flex-col justify-between">
//   //         <div>
//   //           <div className="flex">
//   //             <span className="text-content/60 font-semibold mr-2">
//   //               Total Tokens in Stakes
//   //             </span>
//   //             <TooltipInfo id="tooltip-total-tokens-in-stakes">
//   //               <p>Tokens that are locked in stakes.</p>
//   //             </TooltipInfo>
//   //           </div>
//   //           <div className="text-2xl font-semibold mt-2 mb-12 xl:mb-0">
//   //             <span className="mr-3">{data?.total}</span>
//   //             <span className="text-content/60">OGY</span>
//   //           </div>
//   //         </div>
//   //         <div className="xl:flex items-center mb-6 hidden">
//   //           <div className="h-2 w-4 bg-[#38bdf8] mr-2 rounded-lg"></div>
//   //           <div className="text-xs text-content/60 font-semibold">
//   //             STAKED TOKENS
//   //           </div>
//   //         </div>
//   //       </div>
//   //       <div className="col-span-3 h-72 rounded-xl">
//   //         <ChartArea data={data?.dataChart} fill={barFill} />
//   //       </div>
//   //       <div className="flex items-center justify-end mt-2 mr-6 xl:hidden">
//   //         <div className="h-2 w-4 bg-[#38bdf8] mr-2 rounded-lg"></div>
//   //         <div className="text-xs text-content/60 font-semibold">
//   //           STAKED TOKENS
//   //         </div>
//   //       </div>
//   //     </div>
//   //   )}
//   //   {isError && (
//   //     <ChartError>Error while fetching governance staking data.</ChartError>
//   //   )}
//   // </Card>
// };

// export default ChartActiveAccounts;
