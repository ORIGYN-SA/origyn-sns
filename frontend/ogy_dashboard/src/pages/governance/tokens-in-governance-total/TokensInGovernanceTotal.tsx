import { useMemo } from "react";
import { TooltipInfo } from "@components/ui";
import { PieStatsCard } from "@components/dashboard";
import useGovernanceStats from "@hooks/governance/useGovernanceStats";

const FAKE_COLORS = ["#34d399", "#1d7555", "#7bf8ca"];

const TokensInGovernanceTotal = ({ className }: { className?: string }) => {
  const { data, isLoading, isError, error } = useGovernanceStats();

  const colors = useMemo(
    () => data?.tokensInGovernance.map((d) => d.color) ?? FAKE_COLORS,
    [data]
  );

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
    <PieStatsCard
      className={className}
      layout="horizontal"
      title="Tokens in Governance"
      titleTooltip={
        <TooltipInfo id="tooltip-total-token-governance">
          <p>
            All the tokens that are in the governance canister. These tokens can
            be in vesting state, staking state, unstaked or unclaimed.
          </p>
        </TooltipInfo>
      }
      data={data?.tokensInGovernance}
      colors={colors}
      infos={infos}
      totalLabel="Total Tokens in Governance"
      totalValue={data?.tokensInGovernanceTotal}
      loading={isLoading}
      isError={isError}
      errorMessage={error?.message}
    />
  );
};

export default TokensInGovernanceTotal;
