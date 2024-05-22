import { Card, LoaderSpin } from "@components/ui";
import PieChart from "@components/charts/pie/Pie";
import useGovernanceStats from "@hooks/governance/useGovernanceStats";
import { usePieChart } from "@components/charts/pie/context";

export interface TokensInGovernanceProps {
  className?: string;
  tokensInGovernance: TokensInGovernanceData[];
  tokensInGovernanceTotal: number;
}

interface TokensInGovernanceData {
  name: string;
  value: number;
  color: string;
}

const TokensInGovernanceTotal = ({ className }: { className: string }) => {
  const { data, isSuccess, isLoading, isError, error } = useGovernanceStats();
  const { setActiveIndex } = usePieChart();
  return (
    <Card className={`${className}`}>
      {isSuccess && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
          <div>
            <div className="mt-6 h-80 rounded-xl">
              <PieChart
                data={data.tokensInGovernance}
                colors={data.tokensInGovernance.map((d) => d.color)}
              />
            </div>
            <div className="flex flex-col items-center my-4">
              <h2 className="text-lg font-semibold text-content/60">
                Total Tokens in Governance
              </h2>
              <div className="mt-4 flex items-center text-2xl font-semibold">
                <img src="/ogy_logo.svg" alt="OGY Logo" />
                <span className="ml-2 mr-3">
                  {data.tokensInGovernanceTotal}
                </span>
                <span className="text-content/60">OGY</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-8">
            {data.tokensInGovernance.map(
              ({ name, valueToString: value, color }, index) => (
                <Card
                  className="bg-surface-2 pb-8"
                  key={name}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  <div className="flex items-center text-lg">
                    <span className="text-content/60">{name}</span>
                  </div>
                  <div className="flex items-center mt-2 text-2xl font-semibold">
                    <span className="mr-3">{value}</span>
                    <span className="text-content/60">OGY</span>
                  </div>
                  <Card.BorderBottom color={color} />
                </Card>
              )
            )}
          </div>
        </div>
      )}
      {isLoading && (
        <div className="flex items-center justify-center h-96 mx-auto">
          <LoaderSpin size="xl" />
        </div>
      )}
      {isError && (
        <div className="flex items-center justify-center h-40 text-red-500 font-semibold">
          <div>{error?.message}</div>
        </div>
      )}
    </Card>
  );
};

export default TokensInGovernanceTotal;
