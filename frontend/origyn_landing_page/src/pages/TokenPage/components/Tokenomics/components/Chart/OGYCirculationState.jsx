import { PieStatsCard } from "@origyn/shared/charts";
import { TooltipInfo, ExternalLink } from "@origyn/shared/ui";
import useCirculationStateOGY from "@/hooks/useCirculationStateOGY";

const COLORS = ["#645eff", "#333089"];

const INFOS = [
  {
    id: "tooltip-amount-not-owned",
    name: "OGY not in the hand of the Foundation",
    value: "Amount of circulated tokens not owned by ORIGYN foundation.",
  },
  {
    id: "tooltip-amount-owned",
    name: "OGY locked in the hand of the Foundation",
    value: "Amount of locked tokens owned by ORIGYN foundation.",
  },
];

const OGYCirculationState = () => {
  const { data, loading, error } = useCirculationStateOGY();

  return (
    <PieStatsCard
      className="w-full"
      title="OGY Circulation State"
      titleTooltip={
        <TooltipInfo id="tooltip-circulation-state">
          The circulating supply is all tokens except unlocked tokens owned by
          the ORIGYN Foundation.
          <ExternalLink href="https://dashboard.internetcomputer.org/proposal/117360">
            NNS Proposal
          </ExternalLink>
        </TooltipInfo>
      }
      data={data?.dataPieChart}
      colors={COLORS}
      infos={INFOS}
      totalLabel="Total OGY Circulation"
      totalValue={data?.string.circulatingSupply}
      loading={loading}
      isError={!!error}
    />
  );
};

export default OGYCirculationState;
