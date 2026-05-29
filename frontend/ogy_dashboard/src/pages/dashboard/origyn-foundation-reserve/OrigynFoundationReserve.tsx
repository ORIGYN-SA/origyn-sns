import { useMemo } from "react";
import { TooltipInfo } from "@components/ui";
import { PieStatsCard } from "@components/dashboard";
import useFoundationReserve from "@hooks/metrics/useFoundationReserve";
import { useT } from "@i18n/LocaleContext";

type OrigynFoundationReserveProps = {
  className?: string;
};

const COLORS = ["#ff55c5", "#90306f"];

const OrigynFoundationReserve = ({
  className,
}: OrigynFoundationReserveProps) => {
  const t = useT();
  const infos = useMemo(
    () => [
      {
        id: "tooltip-amount-locked",
        name: t("dashboard.foundationReserve.lockedName"),
        value: (
          <div>
            <p>{t("dashboard.foundationReserve.lockedIntro")}</p>
            <br />
            <p>{t("dashboard.foundationReserve.lockedStakes")}</p>
            <p>{t("dashboard.foundationReserve.lockedStakesNote")}</p>
            <br />
            <p>{t("dashboard.foundationReserve.lockedVestings")}</p>
            <p>{t("dashboard.foundationReserve.lockedVestingsNote")}</p>
          </div>
        ),
      },
      {
        id: "tooltip-amount-unlocked",
        name: t("dashboard.foundationReserve.unlockedName"),
        value: t("dashboard.foundationReserve.unlockedValue"),
      },
    ],
    [t]
  );

  const { data: foundationAssets, isLoading, isError } = useFoundationReserve();

  return (
    <PieStatsCard
      className={className}
      title={t("dashboard.foundationReserve.title")}
      titleTooltip={
        <TooltipInfo id="tooltip-amount-foundation">
          {t("dashboard.foundationReserve.tooltip")}
        </TooltipInfo>
      }
      data={foundationAssets?.dataPieChart}
      colors={COLORS}
      infos={infos}
      totalLabel={t("dashboard.foundationReserve.totalLabel")}
      totalValue={foundationAssets?.string.totalSupply}
      loading={isLoading}
      isError={isError}
    />
  );
};

export default OrigynFoundationReserve;
