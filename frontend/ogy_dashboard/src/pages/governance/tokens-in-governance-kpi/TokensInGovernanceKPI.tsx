import { TooltipInfo, SkeletonOverlay } from "@components/ui";
import { CardErrorOverlay, StatCard } from "@components/dashboard";
import useProposalsMetrics from "@hooks/proposals/useProposalsMetrics";
import { useT } from "@i18n/LocaleContext";

const COLORS = [
  "#a78bfa", // purple-400
  "#60a5fa", // blue-400
  "#facc15", // yellow-400
  "#9ca3af", // gray-400
  "#f472b6", // pink-400
  "#f87171", // red-400
];

const TokensInGovernanceKPI = ({ className }: { className?: string }) => {
  const t = useT();
  const { data, isLoading, isSuccess, isError } = useProposalsMetrics();

  const hasError = !isLoading && isError;
  const showSkeleton = isLoading || hasError;
  const placeholderItems = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    name: `${t("governance.kpi.metric")} ${i + 1}`,
    value: undefined,
    tooltip: t("common.loading"),
  }));
  const items = showSkeleton || !isSuccess || !data ? placeholderItems : data;

  return (
    <div className={`relative ${className ?? ""}`}>
      <SkeletonOverlay loading={showSkeleton}>
        {hasError && (
          <CardErrorOverlay title={t("governance.tokensSection.title")} />
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {items.map(({ name, value, tooltip }, index) => (
            <StatCard
              key={name}
              title={name}
              value={value}
              loading={showSkeleton}
              tooltip={
                <TooltipInfo id={name} clickable={true}>
                  {tooltip}
                </TooltipInfo>
              }
              underlineColor={COLORS[index]}
            />
          ))}
        </div>
      </SkeletonOverlay>
    </div>
  );
};

export default TokensInGovernanceKPI;
