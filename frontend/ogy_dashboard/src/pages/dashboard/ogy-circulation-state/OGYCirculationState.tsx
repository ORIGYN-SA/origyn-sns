import { useMemo } from "react";
import { TooltipInfo, ExternalLink } from "@components/ui";
import { PieStatsCard } from "@components/dashboard";
import useCirculationStateOGY from "@hooks/metrics/useCirculationStateOGY";
import { useT } from "@i18n/LocaleContext";

type OGYCirculationStateProps = {
  className?: string;
};

const COLORS = ["#645eff", "#333089"];

const OGYCirculationState = ({ className }: OGYCirculationStateProps) => {
  const t = useT();
  const infos = useMemo(
    () => [
      {
        id: "tooltip-amount-not-owned",
        name: t("dashboard.circulationState.notOwnedName"),
        value: t("dashboard.circulationState.notOwnedValue"),
      },
      {
        id: "tooltip-amount-owned",
        name: t("dashboard.circulationState.ownedName"),
        value: t("dashboard.circulationState.ownedValue"),
      },
    ],
    [t]
  );
  const { data, isLoading, isError } = useCirculationStateOGY();

  return (
    <PieStatsCard
      className={className}
      title={t("dashboard.circulationState.title")}
      titleTooltip={
        <TooltipInfo id="tooltip-circulation-state" clickable={true}>
          {t("dashboard.circulationState.tooltip")}
          <ExternalLink href="https://dashboard.internetcomputer.org/proposal/117360">
            {t("dashboard.circulationState.nnsProposal")}
          </ExternalLink>
        </TooltipInfo>
      }
      data={data?.dataPieChart}
      colors={COLORS}
      infos={infos}
      totalLabel={t("dashboard.circulationState.totalLabel")}
      totalValue={data?.string.circulatingSupply}
      loading={isLoading}
      isError={isError}
    />
  );
};

export default OGYCirculationState;
