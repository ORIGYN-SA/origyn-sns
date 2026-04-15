import { useMemo } from "react";
import {
  Card,
  LoaderSpin,
  TooltipInfo,
  Skeleton,
  ExternalLink,
} from "@components/ui";
import { StatCard } from "@components/dashboard";
import PieChart from "@components/charts/pie/Pie";
import useCirculationStateOGY from "@hooks/metrics/useCirculationStateOGY";
import { usePieChart } from "@components/charts/pie/context";

type OGYCirculationState = {
  className?: string;
};

const OGYCirculationState = ({
  className,
  ...restProps
}: OGYCirculationState) => {
  const colors = useMemo(() => ["#645eff", "#333089"], []);
  const infos = useMemo(
    () => [
      {
        id: "tooltip-amount-not-owned",
        value: "Amount of circulated tokens not owned by ORIGYN foundation.",
      },
      {
        id: "tooltip-amount-owned",
        value: "Amount of locked tokens owned by ORIGYN foundation.",
      },
    ],
    []
  );
  const { data, isLoading, isSuccess, isError, error } =
    useCirculationStateOGY();

  useCirculationStateOGY();

  const { activeIndex, setActiveIndex } = usePieChart();

  return (
    <Card className={`${className}`} {...restProps}>
      {isError && (
        <div className="bg-rose-500 rounded-xl text-white font-bold mb-8 p-6">
          {error?.message}
        </div>
      )}
      <>
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">OGY Circulation State</div>
          <TooltipInfo id="tooltip-circulation-state" clickable={true}>
            The circulating supply is all tokens except unlocked tokens owned by
            the ORIGYN Foundation.
            <ExternalLink href="https://dashboard.internetcomputer.org/proposal/117360">
              NNS Proposal
            </ExternalLink>
          </TooltipInfo>
        </div>
        <div className="mt-6 h-72 rounded-xl">
          {isSuccess && data && (
            <PieChart data={data.dataPieChart} colors={colors} />
          )}
          {(isLoading || isError) && (
            <LoaderSpin
              size="lg"
              className="flex justify-center items-center h-full "
            />
          )}
        </div>
        <div className="flex flex-col items-center my-4">
          <h2 className="text-lg font-semibold text-content/60">
            Total OGY Circulation
          </h2>
          <div className="mt-4 flex items-center text-2xl font-semibold">
            {isSuccess && data && (
              <>
                <img src="/ogy_logo.svg" alt="OGY Logo" />
                <span className="ml-2 mr-3">
                  {data.string.circulatingSupply}
                </span>
                <span className="text-content/60">OGY</span>
              </>
            )}
            {(isLoading || isError) && <Skeleton className="w-64" />}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 mt-8">
          {isSuccess &&
            data &&
            data.dataPieChart.map(({ name, valueToString }, index) => (
              <StatCard
                key={name}
                title={name}
                value={valueToString}
                unit="OGY"
                accessory={
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: colors[index] }}
                  />
                }
                tooltip={
                  <TooltipInfo id={infos[index].id}>
                    {infos[index].value}
                  </TooltipInfo>
                }
                underlineColor={colors[index]}
                active={activeIndex === index}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              />
            ))}
        </div>
      </>
    </Card>
  );
};

export default OGYCirculationState;
