import { TooltipInfo } from "@components/ui";
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

const PLACEHOLDER_ITEMS = Array.from({ length: 6 }, (_, i) => ({ id: i }));

const TokensInGovernanceKPI = ({ className }: { className?: string }) => {
  const { data, isLoading, isSuccess } = useProposalsMetrics();

  return (
    <div className={className}>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {isLoading
          ? PLACEHOLDER_ITEMS.map((item) => (
              <StatCard
                key={item.id}
                loading
                underlineColor={COLORS[item.id]}
              />
            ))
          : isSuccess &&
            data.map(({ name, value, tooltip }, index) => (
              <StatCard
                key={name}
                title={name}
                value={value}
                tooltip={
                  <TooltipInfo id={name} clickable={true}>
                    {tooltip}
                  </TooltipInfo>
                }
                underlineColor={COLORS[index]}
              />
            ))}
      </div>
    </div>
  );
};

export default TokensInGovernanceKPI;
