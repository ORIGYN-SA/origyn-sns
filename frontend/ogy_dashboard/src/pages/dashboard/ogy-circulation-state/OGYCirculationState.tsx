import { useMemo } from "react";
import { TooltipInfo, ExternalLink } from "@components/ui";
import { PieStatsCard } from "@components/dashboard";
import useCirculationStateOGY from "@hooks/metrics/useCirculationStateOGY";

type OGYCirculationStateProps = {
  className?: string;
};

const COLORS = ["#645eff", "#333089"];

const OGYCirculationState = ({ className }: OGYCirculationStateProps) => {
  const infos = useMemo(
    () => [
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
    ],
    []
  );
  const { data, isLoading, isError, error } = useCirculationStateOGY();

  return (
    <PieStatsCard
      className={className}
      title="OGY Circulation State"
      titleTooltip={
        <TooltipInfo id="tooltip-circulation-state" clickable={true}>
          The circulating supply is all tokens except unlocked tokens owned by
          the ORIGYN Foundation.
          <ExternalLink href="https://dashboard.internetcomputer.org/proposal/117360">
            NNS Proposal
          </ExternalLink>
        </TooltipInfo>
      }
      data={data?.dataPieChart}
      colors={COLORS}
      infos={infos}
      totalLabel="Total OGY Circulation"
      totalValue={data?.string.circulatingSupply}
      loading={isLoading}
      isError={isError}
      errorMessage={error?.message}
    />
  );
};

export default OGYCirculationState;
