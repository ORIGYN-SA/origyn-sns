import { useState } from "react";
import AreaChart from "@components/charts/area/Area";
import { Card, TooltipInfo } from "@components/ui";
import useTotalOGYSupply from "@hooks/metrics/useTotalOGYSupply";

const SELECT_PERIOD_OPTIONS = [
  { value: "daily" },
  { value: "weekly" },
  { value: "monthly" },
  { value: "yearly" },
];

const CHART_FILL = "#38bdf8";

const TotalOGYSupply = ({ className }: { className?: string }) => {
  const [selectedPeriod, setSelectedPeriod] = useState("weekly");
  const { data } = useTotalOGYSupply({ period: selectedPeriod });

  return (
    <Card className={`flex flex-col ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-[16px] leading-none text-muted">
              Total OGY Supply
            </h2>
            <TooltipInfo
              id="tooltip-total-ogy-supply"
              title="Total amount of OGY tokens available."
            >
              <p>
                This includes the circulating supply and the supply under
                control of the ORIGYN Foundation.
              </p>
              <p>
                As of 18th September, ORIGYN switched to fully deflationary
                model which means no more new minted tokens.
              </p>
            </TooltipInfo>
          </div>
          <div className="flex items-baseline">
            <img
              src="/ogy_logo.svg"
              alt="OGY Logo"
              className="w-[25px] h-6 self-center"
            />
            <span className="ml-2 mr-3 font-bold text-[28px] leading-none">
              {data.totalSupply}
            </span>
            <span className="font-semibold text-[22px] leading-none text-muted">
              OGY
            </span>
          </div>
        </div>
        <div className="relative inline-flex items-center gap-2 rounded-full bg-white border border-[#E1E1E1] py-3 px-4 font-medium text-[13px] leading-none">
          <span className="capitalize">{selectedPeriod}</span>
          <svg
            className="pointer-events-none shrink-0"
            width="8"
            height="8"
            viewBox="0 0 8 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6.64 2.98328L4.46667 5.15661C4.21 5.41328 3.79 5.41328 3.53333 5.15661L1.36 2.98328"
              stroke="#222526"
              strokeWidth="1.5"
              strokeMiterlimit="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer focus:outline-none"
          >
            {SELECT_PERIOD_OPTIONS.map(({ value }) => (
              <option key={value} value={value} className="capitalize">
                {value}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4 flex-1 min-h-72 w-full rounded-xl">
        <AreaChart data={data.dataPieChart} fill={CHART_FILL} />
      </div>
    </Card>
  );
};

export default TotalOGYSupply;
