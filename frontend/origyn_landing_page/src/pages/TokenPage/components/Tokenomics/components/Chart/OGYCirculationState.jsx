import useCirculationStateOGY from "@/hooks/useCirculationStateOGY";
import Chart from "./Chart";

const COLORS = ["#645eff", "#333089"];

const HEADER_TOOLTIP = {
  id: "tooltip-circulation-state",
  clickable: true,
  content: (
    <>
      The circulating supply is all tokens except unlocked tokens owned by the
      ORIGYN Foundation.{" "}
      <a
        href="https://dashboard.internetcomputer.org/proposal/117360"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: "#615bff", marginTop: 4, display: "inline-block" }}
      >
        NNS Proposal ↗
      </a>
    </>
  ),
};

const INFOS = [
  {
    id: "tooltip-amount-not-owned",
    content: "Amount of circulated tokens not owned by ORIGYN foundation.",
  },
  {
    id: "tooltip-amount-owned",
    content: "Amount of locked tokens owned by ORIGYN foundation.",
  },
];

const OGYCirculationState = () => {
  const { data, loading, error } = useCirculationStateOGY();

  return (
    <Chart
      title="OGY Circulation State"
      colors={COLORS}
      headerTooltip={HEADER_TOOLTIP}
      totalLabel="Total OGY Circulation"
      totalValue={data?.string.circulatingSupply ?? null}
      chartData={data?.dataPieChart ?? null}
      infos={INFOS}
      loading={loading}
      error={error}
    />
  );
};

export default OGYCirculationState;
