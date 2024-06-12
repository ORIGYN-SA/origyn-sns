import { useMemo } from "react";
import { Card, TooltipInfo, LoaderSpin } from "@components/ui";
import useProposalsMetrics from "@hooks/metrics/useProposalsMetrics";

export interface TokensInGovernanceKPIProps {
  className?: string;
  data: Data[];
}

interface Data {
  name: string;
  value: number;
}

const TokensInGovernanceKPI = ({ className }: TokensInGovernanceKPIProps) => {
  const { data, isLoading, isSuccess, isError } = useProposalsMetrics();

  const colorsClassName = useMemo(
    () => [
      "bg-purple-400",
      "bg-blue-400",
      "bg-yellow-400",
      "bg-gray-400",
      "bg-pink-400",
      "bg-red-400",
    ],
    []
  );
  return (
    <div className={`${className}`}>
      {(isLoading || isError) && (
        <div className="flex flex-col items-center justify-center h-96 border border-border rounded-2xl">
          <div className="mb-8 font-semibold">Fetching Proposals KPI's...</div>
          <LoaderSpin size="xl" />
        </div>
      )}
      {isSuccess && (
        <div className={`grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8`}>
          {data.map(({ name, value, tooltip }, index) => (
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
                {value}
              </div>
              <Card.BorderBottom className={colorsClassName[index]} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TokensInGovernanceKPI;
