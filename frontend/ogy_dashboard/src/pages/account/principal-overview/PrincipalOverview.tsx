import { useParams } from "react-router-dom";
import { useMemo } from "react";
import { Card, LoaderSpin, TooltipInfo } from "@components/ui";
import PieChart from "@components/charts/pie/Pie";
import { roundAndFormatLocale } from "@helpers/numbers";
import usePrincipalOverview from "@hooks/accounts/usePrincipalOverview";
import { usePieChart } from "@components/charts/pie/context";

const PrincipalOverview = ({ className }: { className?: string }) => {
  const { accountId } = useParams<{ accountId: string }>();
  const { data, isSuccess, isLoading, isError, error } = usePrincipalOverview(
    accountId || ""
  );

  console.log("principalOverview", data);
  const { activeIndex, setActiveIndex } = usePieChart();

  const chartData = useMemo(
    () =>
      isSuccess && data
        ? [
            {
              name: "Total Sent",
              value: Number(data.totalSend) || 0,
              color: "#645eff",
            },
            {
              name: "Total Received",
              value: Number(data.totalReceive) || 0,
              color: "#333089",
            },
          ]
        : [],
    [data, isSuccess]
  );

  const stats = useMemo(
    () => [
      {
        label: "Total Sent",
        value: data?.totalSend || 0,
        token: "OGY",
        tooltip: "Total amount sent by the principal.",
        color: "#645eff",
      },
      {
        label: "Total Received",
        value: data?.totalReceive || 0,
        token: "OGY",
        tooltip: "Total amount received by the principal.",
        color: "#333089",
      },
      {
        label: "Total Volume",
        value:
          data?.totalVolume && !isNaN(Number(data.totalVolume))
            ? data.totalVolume
            : 0,
        token: "OGY",
        tooltip: "Total volume of transactions (sent + received).",
        color: "#56aaff",
      },
    ],
    [data]
  );

  return (
    <Card className={`${className}`}>
      {isSuccess && data && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
          {/* Pie Chart Section */}
          <div>
            <div className="mt-6 h-80 rounded-xl">
              <PieChart
                data={chartData}
                colors={chartData.map((d) => d.color)}
              />
            </div>
            <div className="flex flex-col items-center my-4">
              <div className="flex items-center">
                <h2 className="text-lg font-semibold text-content/60 mr-2">
                  Principal Account Overview
                </h2>
                <TooltipInfo id="tooltip-principal-overview">
                  <p>Overview of the principal's account transactions.</p>
                </TooltipInfo>
              </div>
              <div className="mt-4 flex items-center text-2xl font-semibold">
                <img src="/ogy_logo.svg" alt="OGY Logo" />
                <span className="ml-2 mr-3">
                  {roundAndFormatLocale({
                    number: Number(data.totalVolume),
                  })}
                </span>
                <span className="text-content/60">OGY</span>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 gap-8">
            {stats.map(({ label, value, token, tooltip, color }, index) => (
              <Card
                key={label}
                className={`bg-surface-2 pb-8 dark:hover:bg-white/10 hover:bg-black/10 ${
                  activeIndex === index ? `dark:bg-white/10 bg-black/10` : ``
                } transition-opacity duration-300`}
                onMouseEnter={() => {
                  if (index >= 0 && index < chartData.length) {
                    setActiveIndex(index);
                  }
                }}
                onMouseLeave={() => {
                  setActiveIndex(null);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-lg">
                    <div
                      className="h-3 w-3 rounded-full mr-2"
                      style={{ backgroundColor: color }}
                    ></div>
                    <span className="text-content/60">{label}</span>
                  </div>
                  <TooltipInfo
                    id={`tooltip-${label.replace(" ", "-").toLowerCase()}`}
                  >
                    {tooltip}
                  </TooltipInfo>
                </div>
                <div className="flex items-center mt-2 text-2xl font-semibold">
                  <span className="mr-3">
                    {roundAndFormatLocale({ number: value })}
                  </span>
                  <span className="text-content/60">{token}</span>
                </div>
                <Card.BorderBottom color={color} />
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center h-96 mx-auto">
          <LoaderSpin size="xl" />
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="flex items-center justify-center h-40 text-red-500 font-semibold">
          <div>{error?.message || "An error occurred"}</div>
        </div>
      )}
    </Card>
  );
};

export default PrincipalOverview;
