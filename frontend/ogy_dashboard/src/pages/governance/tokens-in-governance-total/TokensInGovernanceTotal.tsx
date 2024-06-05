import { useMemo } from "react";
import { Card, LoaderSpin, TooltipInfo } from "@components/ui";
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
  const { activeIndex, setActiveIndex } = usePieChart();
  const infos = useMemo(
    () => [
      {
        id: "tooltip-locked-governance",
        value: "Tokens that are locked in governance.",
      },
      {
        id: "tooltip-unlocked-governance",
        value:
          "Tokens that are unlocked in governance and could be withdrawn and traded at any time.",
      },
      {
        id: "tooltip-accumulated-rewards",
        value: "Rewards that are counted for users but are not claimed yet.",
      },
    ],
    []
  );
  return (
    <Card className={`${className}`}>
      {isSuccess && data && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
          <div>
            <div className="mt-6 h-80 rounded-xl">
              <PieChart
                data={data.tokensInGovernance}
                colors={data.tokensInGovernance.map((d) => d.color)}
              />
            </div>
            <div className="flex flex-col items-center my-4">
              <div className="flex items-center">
                <h2 className="text-lg font-semibold text-content/60 mr-2">
                  Total Tokens in Governance
                </h2>
                <TooltipInfo id="tooltip-total-token-governance">
                  <p>
                    All the tokens that are in the governance canister. These
                    tokens can be in vesting state, staking state, unstaked or
                    unclaimed.
                  </p>
                </TooltipInfo>
              </div>

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
                  className={`bg-surface-2 pb-8 dark:hover:bg-white/10 hover:bg-black/10 ${
                    activeIndex === index ? `dark:bg-white/10 bg-black/10` : ``
                  } transition-opacity duration-300`}
                  key={name}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-lg">
                      <div
                        className="h-3 w-3 rounded-full mr-2"
                        style={{ backgroundColor: color }}
                      ></div>
                      <span className="text-content/60">{name}</span>
                    </div>
                    <TooltipInfo id={infos[index].id}>
                      {infos[index].value}
                    </TooltipInfo>
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
