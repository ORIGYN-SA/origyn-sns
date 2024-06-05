import { useMemo } from "react";
import { Card, LoaderSpin, TooltipInfo, Skeleton } from "@components/ui";
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
          <TooltipInfo id="tooltip-circulation-state">
            The circulating supply is all tokens except unlocked tokens owned by
            the ORIGYN Foundation.
          </TooltipInfo>
        </div>
        <div className="mt-6 h-80 rounded-xl">
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
        <div className="grid grid-cols-1 gap-4">
          {isSuccess &&
            data &&
            data.dataPieChart.map(({ name, valueToString }, index) => (
              <Card
                className={`bg-surface-2/40 dark:bg-surface-2 mt-8 pb-8 dark:hover:bg-white/10 hover:bg-black/5 ${
                  activeIndex === index ? `dark:bg-white/10 bg-black/5` : ``
                } transition-opacity duration-300`}
                key={name}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-lg">
                    <div
                      className="h-3 w-3 rounded-full mr-2"
                      style={{ backgroundColor: colors[index] }}
                    ></div>
                    <span className="text-content/60">{name}</span>
                  </div>
                  <TooltipInfo id={infos[index].id}>
                    {infos[index].value}
                  </TooltipInfo>
                </div>
                <div className="flex items-center mt-4 text-2xl font-semibold">
                  {isSuccess && (
                    <>
                      <span className="mr-3">{valueToString}</span>
                      <span className="text-content/60">OGY</span>
                    </>
                  )}
                  {(isLoading || isError) && <Skeleton className="w-64" />}
                </div>
                <Card.BorderBottom color={colors[index]} />
              </Card>
            ))}
        </div>
      </>
    </Card>
  );
};

export default OGYCirculationState;
