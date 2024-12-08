// components/metrics/OGYActivitiesMetrics.tsx
import { useMemo } from "react";
import { Card, TooltipInfo } from "@components/ui";
import useOGYActivitiesMetrics from "@hooks/metrics/useOGYActivitiesMetrics";
import ChartLoader from "@components/charts/utils/Loader";
import ChartError from "@components/charts/utils/Error";

const OGYActivitiesMetrics = ({
  className,
  ...restProps
}: {
  className?: string;
}) => {
  const { data, isSuccess, isLoading, isError } = useOGYActivitiesMetrics();

  const colorsClassName = useMemo(
    () => ["bg-green-400", "bg-blue-400", "bg-red-400", "bg-yellow-400"],
    []
  );

  const metrics = useMemo(() => {
    if (!data) return [];

    return [
      {
        name: "Total Transfers Today",
        value: data.transfersPerDay,
        tooltip: (
          <>
            <p>The total number of OGY tokens transferred today.</p>
            <p>
              Includes all transfer transactions made during the current day.
            </p>
          </>
        ),
      },
      {
        name: "Total Transfers This Month",
        value: data.transfersPerMonth,
        tooltip: (
          <>
            <p>The total number of OGY tokens transferred this month.</p>
            <p>
              Includes all transfer transactions made during the current month.
            </p>
          </>
        ),
      },
      {
        name: "Total Burned Today",
        value: data.burnsPerDay,
        tooltip: (
          <>
            <p>The total number of OGY tokens burned today.</p>
            <p>Includes all burn transactions made during the current day.</p>
          </>
        ),
      },
      {
        name: "Total Burned This Month",
        value: data.burnsPerMonth,
        tooltip: (
          <>
            <p>The total number of OGY tokens burned this month.</p>
            <p>Includes all burn transactions made during the current month.</p>
          </>
        ),
      },
    ];
  }, [data]);

  return (
    <Card className={`${className}`} {...restProps}>
      {isError && (
        <ChartError>Error fetching OGY activities metrics.</ChartError>
      )}
      {isLoading && <ChartLoader />}
      <h2 className="text-lg font-semibold  mr-2 mb-6">
        OGY Transfer and Burn Stats
      </h2>
      {isSuccess && data && !isLoading && (
        <div className={`grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-8`}>
          {metrics.map(({ name, value, tooltip }, index) => (
            <Card className="bg-surface pb-8" key={name}>
              <div className="flex items-center">
                <h2 className="text-lg font-semibold text-content/60 mr-2">
                  {name}
                </h2>
                <TooltipInfo id={name} clickable={true}>
                  {tooltip}
                </TooltipInfo>
              </div>

              <div className="flex items-center mt-2 text-2xl font-semibold">
                <span>{value}</span>
              </div>
              <Card.BorderBottom
                className={colorsClassName[index % colorsClassName.length]}
              />
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
};

export default OGYActivitiesMetrics;
