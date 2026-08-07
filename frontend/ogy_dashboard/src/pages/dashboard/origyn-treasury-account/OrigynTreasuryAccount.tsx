import { Card, TooltipInfo, SkeletonOverlay } from "@components/ui";
import { CardErrorOverlay, StatCard } from "@components/dashboard";
import useFetchTreasuryAccountOTA from "@hooks/accounts/useFetchTreasuryAccountOTA";
import { useT } from "@i18n/LocaleContext";

type OrigynTreasuryAccountProps = {
  className?: string;
};

const OrigynTreasuryAccount = ({
  className,
  ...restProps
}: OrigynTreasuryAccountProps) => {
  const t = useT();
  const { ogy, icp, isLoading, isError } = useFetchTreasuryAccountOTA();

  const hasError = !isLoading && isError;
  const showSkeleton = isLoading || hasError;

  const cards = [
    {
      value: ogy,
      token: "OGY",
      logo: "/ogy_logo.svg",
      className: "bg-purple-500",
      tooltipId: "tooltip-ota-ogy",
      tooltip: t("dashboard.treasuryAccount.tooltipOgy"),
    },
    {
      value: icp,
      token: "ICP",
      logo: "/icp_logo.svg",
      className: "bg-pink-500",
      tooltipId: "tooltip-ota-icp",
      tooltip: t("dashboard.treasuryAccount.tooltipIcp"),
    },
  ];

  return (
    <SkeletonOverlay loading={showSkeleton}>
      <Card className={`${className}`} {...restProps}>
        {hasError && (
          <CardErrorOverlay title={t("dashboard.treasuryAccount.title")} />
        )}
        <div
          data-skel-static
          className="text-content text-[22px] font-semibold leading-none"
        >
          {t("dashboard.treasuryAccount.title")}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-8">
          {cards.map(
            ({ value, token, className, logo, tooltipId, tooltip }) => (
              <StatCard
                key={token}
                title={`${t("dashboard.treasuryAccount.networkRevenue")} (${token})`}
                value={showSkeleton ? undefined : value}
                unit={token}
                loading={showSkeleton}
                accessory={
                  <img
                    src={logo}
                    alt={t("dashboard.treasuryAccount.tokenLogoAlt")}
                    className="h-4 w-4 object-contain"
                  />
                }
                tooltip={
                  <TooltipInfo id={tooltipId}>
                    <p>{tooltip}</p>
                  </TooltipInfo>
                }
                underlineClassName={className}
              />
            )
          )}
        </div>
      </Card>
    </SkeletonOverlay>
  );
};

export default OrigynTreasuryAccount;
