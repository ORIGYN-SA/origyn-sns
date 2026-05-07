// components/metrics/OGYActivitiesMetrics.tsx
import { useMemo } from "react";
import { Card, TooltipInfo, SkeletonOverlay } from "@components/ui";
import { CardErrorOverlay } from "@components/dashboard";
import useOGYActivitiesMetrics from "@hooks/metrics/useOGYActivitiesMetrics";

const PLACEHOLDER_VALUE = "000,000";

const OGYActivitiesMetrics = ({
  className,
  ...restProps
}: {
  className?: string;
}) => {
  const { data, isLoading, isError } = useOGYActivitiesMetrics();

  const hasError = !isLoading && isError;
  const showSkeleton = isLoading || hasError;

  const colorsClassName = useMemo(
    () => ["bg-green-400", "bg-blue-400", "bg-red-400", "bg-yellow-400"],
    []
  );

  const metrics = useMemo(() => {
    const values = data ?? {
      transfersPerDay: PLACEHOLDER_VALUE,
      transfersPerMonth: PLACEHOLDER_VALUE,
      burnsPerDay: PLACEHOLDER_VALUE,
      burnsPerMonth: PLACEHOLDER_VALUE,
    };

    return [
      {
        name: "Total Transfers Today",
        value: values.transfersPerDay,
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
        value: values.transfersPerMonth,
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
        value: values.burnsPerDay,
        tooltip: (
          <>
            <p>The total number of OGY tokens burned today.</p>
            <p>Includes all burn transactions made during the current day.</p>
          </>
        ),
      },
      {
        name: "Total Burned This Month",
        value: values.burnsPerMonth,
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
    <SkeletonOverlay loading={showSkeleton}>
      <Card className={`${className}`} {...restProps}>
        {hasError && <CardErrorOverlay title="OGY Transfer and Burn Stats" />}
        <h2
          data-skel-static
          className="text-lg font-semibold mr-2 mb-6"
        >
          OGY Transfer and Burn Stats
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-8">
          {metrics.map(({ name, value, tooltip }, index) => (
            <Card className="bg-surface pb-8" key={name}>
              <div data-skel-static className="flex items-center">
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
      </Card>
    </SkeletonOverlay>
  );
};

export default OGYActivitiesMetrics;
