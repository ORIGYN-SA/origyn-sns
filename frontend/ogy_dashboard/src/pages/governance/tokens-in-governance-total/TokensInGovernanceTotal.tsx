import { useMemo } from "react";
import { TooltipInfo, SkeletonOverlay } from "@components/ui";
import { PieStatsCard } from "@components/dashboard";
import { FAKE_PIE_SERIES, FAKE_STAT_VALUE } from "@helpers/skeleton/fakeData";
import useGovernanceStats from "@hooks/governance/useGovernanceStats";

const TokensInGovernanceTotal = ({ className }: { className?: string }) => {
  const { data, isLoading, isError, error } = useGovernanceStats();

  const FAKE_COLORS = ["#34d399", "#1d7555", "#7bf8ca"];
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
    <SkeletonOverlay loading={isLoading}>
      <PieStatsCard
        className={className}
        title="Tokens in Governance"
        titleTooltip={
          <TooltipInfo id="tooltip-total-token-governance">
            <p>
              All the tokens that are in the governance canister. These tokens can
              be in vesting state, staking state, unstaked or unclaimed.
            </p>
          </TooltipInfo>
        }
        data={isLoading ? FAKE_PIE_SERIES : data?.tokensInGovernance}
        colors={colors}
        infos={infos}
        totalLabel="Total Tokens in Governance"
        totalValue={isLoading ? FAKE_STAT_VALUE : data?.tokensInGovernanceTotal}
        isError={isError}
        errorMessage={error?.message}
      />
    </SkeletonOverlay>
  );
};

export default TokensInGovernanceTotal;
