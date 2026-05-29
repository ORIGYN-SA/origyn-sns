import { useMemo } from "react";
import { TooltipInfo } from "@components/ui";
import { PieStatsCard } from "@components/dashboard";
import useGovernanceStats from "@hooks/governance/useGovernanceStats";
import { useT } from "@i18n/LocaleContext";

const FAKE_COLORS = ["#34d399", "#1d7555", "#7bf8ca"];

const TokensInGovernanceTotal = ({ className }: { className?: string }) => {
  const t = useT();
  const { data, isLoading, isError } = useGovernanceStats();

  const colors = useMemo(
    () => data?.tokensInGovernance.map((d) => d.color) ?? FAKE_COLORS,
    [data]
  );

  const infos = useMemo(
    () => [
      {
        id: "tooltip-locked-governance",
        name: t("governance.total.locked.name"),
        value: t("governance.total.locked.tooltip"),
      },
      {
        id: "tooltip-unlocked-governance",
        name: t("governance.total.unlocked.name"),
        value: t("governance.total.unlocked.tooltip"),
      },
      {
        id: "tooltip-accumulated-rewards",
        name: t("governance.total.accumulatedRewards.name"),
        value: t("governance.total.accumulatedRewards.tooltip"),
      },
    ],
    [t]
  );

  return (
    <PieStatsCard
      className={className}
      layout="horizontal"
      title={t("governance.tokensSection.title")}
      titleTooltip={
        <TooltipInfo id="tooltip-total-token-governance">
          <p>{t("governance.total.titleTooltip")}</p>
        </TooltipInfo>
      }
      data={data?.tokensInGovernance}
      colors={colors}
      infos={infos}
      totalLabel={t("governance.total.totalLabel")}
      totalValue={data?.tokensInGovernanceTotal}
      loading={isLoading}
      isError={isError}
    />
  );
};

export default TokensInGovernanceTotal;
