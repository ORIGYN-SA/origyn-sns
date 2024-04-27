import { Card } from "@components/ui";
import PieChart from "@components/charts/pie/Pie";

export interface TokensInGovernanceProps {
  className?: string;
  tokensInGovernance: TokensInGovernanceData[];
  colors: string[];
  tokensInGovernanceTotal: number;
}

interface TokensInGovernanceData {
  name: string;
  value: number;
}

const TokensInGovernanceTotal = ({
  className,
  tokensInGovernance: data,
  tokensInGovernanceTotal: total,
  colors,
}: TokensInGovernanceProps) => {
  return (
    <Card className={`grid grid-cols-1 xl:grid-cols-2 gap-12 ${className}`}>
      <div>
        <div className="mt-6 h-80 rounded-xl">
          <PieChart data={data} colors={colors} />
        </div>
        <div className="flex flex-col items-center my-4">
          <h2 className="text-lg font-semibold text-content/60">
            Total Tokens in Governance
          </h2>
          <div className="mt-4 flex items-center text-2xl font-semibold">
            <img src="/ogy_logo.svg" alt="OGY Logo" />
            <span className="ml-2 mr-3">{total}</span>
            <span className="text-content/60">OGY</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-8">
        {data.map(({ name, value }, index) => (
          <Card className="bg-surface-2 pb-8" key={name}>
            <div className="flex items-center text-lg">
              <span className="text-content/60">{name}</span>
            </div>
            <div className="flex items-center mt-2 text-2xl font-semibold">
              <span className="mr-3">{value}</span>
              <span className="text-content/60">OGY</span>
            </div>
            <Card.BorderBottom color={colors[index]} />
          </Card>
        ))}
      </div>
    </Card>
  );
};

export default TokensInGovernanceTotal;
