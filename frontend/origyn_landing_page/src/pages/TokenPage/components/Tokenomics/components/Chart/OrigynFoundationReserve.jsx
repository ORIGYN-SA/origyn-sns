import { PieStatsCard } from "@origyn/shared-ui/charts";
import { TooltipInfo } from "@origyn/shared-ui/ui";
import useFoundationReserve from "@/hooks/useFoundationReserve";

const COLORS = ["#ff55c5", "#90306f"];

const INFOS = [
  {
    id: "tooltip-amount-locked",
    name: "Locked",
    value: (
      <div>
        <p>ORIGYN foundation tokens locked in stakes or vestings.</p>
        <br />
        <p>
          1) Stakes- tokens that are generating the rewards thanks to
          participation in the governance voting.
        </p>
        <p>Those tokens were locked voluntarily.</p>
        <br />
        <p>
          2) Vestings- Tokens that are not receiving any rewards and they cant
          participate in voting.
        </p>
        <p>
          Those tokens were locked by your contract with the ORIGYN Foundation.
        </p>
      </div>
    ),
  },
  {
    id: "tooltip-amount-unlocked",
    name: "Unlocked",
    value: "Unlocked funds owned by ORIGYN foundation.",
  },
];

const OrigynFoundationReserve = () => {
  const { data, loading, error } = useFoundationReserve();

  return (
    <PieStatsCard
      className="w-full"
      title="OGY Foundation Reserve"
      titleTooltip={
        <TooltipInfo id="tooltip-amount-foundation">
          Total amount of OGY tokens owned by ORIGYN foundation across all
          wallets.
        </TooltipInfo>
      }
      data={data?.dataPieChart}
      colors={COLORS}
      infos={INFOS}
      totalLabel="Total Foundation Supply"
      totalValue={data?.string.totalSupply}
      loading={loading}
      isError={!!error}
    />
  );
};

export default OrigynFoundationReserve;
