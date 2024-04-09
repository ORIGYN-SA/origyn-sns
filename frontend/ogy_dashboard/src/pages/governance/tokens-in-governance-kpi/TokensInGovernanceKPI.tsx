import { useMemo } from "react";
import { Card } from "@components/ui";

export interface TokensInGovernanceKPIProps {
  className?: string;
  data: Data[];
}

interface Data {
  name: string;
  value: number;
}

const TokensInGovernanceKPI = ({
  className,
  data,
}: TokensInGovernanceKPIProps) => {
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
    <div
      className={`grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 ${className}`}
    >
      {data.map(({ name, value }, index) => (
        <Card className="bg-surface pb-8" key={name}>
          <div className="flex items-center text-lg font-semibold">
            <span className="text-content/60">{name}</span>
          </div>
          <div className="flex items-center mt-2 text-2xl font-semibold">
            {value}
          </div>
          <Card.BorderBottom className={colorsClassName[index]} />
        </Card>
      ))}
    </div>
  );
};

export default TokensInGovernanceKPI;
