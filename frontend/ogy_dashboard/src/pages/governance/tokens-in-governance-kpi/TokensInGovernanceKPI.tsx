import { TooltipInfo, SkeletonOverlay } from "@components/ui";
import { StatCard } from "@components/dashboard";
import useProposalsMetrics from "@hooks/proposals/useProposalsMetrics";

const COLORS = [
  "#a78bfa", // purple-400
  "#60a5fa", // blue-400
  "#facc15", // yellow-400
  "#9ca3af", // gray-400
  "#f472b6", // pink-400
  "#f87171", // red-400
];

const PLACEHOLDER_ITEMS = Array.from({ length: 6 }, (_, i) => ({
  id: i,
  name: `Metric ${i + 1}`,
  value: undefined,
  tooltip: "Loading…",
}));

const TokensInGovernanceKPI = ({ className }: { className?: string }) => {
  const { data, isLoading, isSuccess } = useProposalsMetrics();

  const items = isLoading || !isSuccess || !data ? PLACEHOLDER_ITEMS : data;

  return (
    <div className={className}>
      <SkeletonOverlay loading={isLoading}>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {items.map(({ name, value, tooltip }, index) => (
            <StatCard
              key={name}
              title={name}
              value={value}
              loading={isLoading}
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
