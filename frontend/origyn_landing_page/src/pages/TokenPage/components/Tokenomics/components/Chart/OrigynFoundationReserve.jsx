import useFoundationReserve from "@/hooks/useFoundationReserve";
import Chart from "./Chart";

const COLORS = ["#ff55c5", "#90306f"];

const HEADER_TOOLTIP = {
  id: "tooltip-amount-foundation",
  content:
    "Total amount of OGY tokens owned by ORIGYN foundation across all wallets.",
};

const INFOS = [
  {
    id: "tooltip-amount-locked",
    content: (
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
    content: "Unlocked funds owned by ORIGYN foundation.",
  },
];

const OrigynFoundationReserve = () => {
  const { data, loading, error } = useFoundationReserve();

  return (
    <Chart
      title="OGY Foundation Reserve"
      colors={COLORS}
      headerTooltip={HEADER_TOOLTIP}
      totalLabel="Total Foundation Supply"
      totalValue={data?.string.totalSupply ?? null}
      chartData={data?.dataPieChart ?? null}
      infos={INFOS}
      loading={loading}
      error={error}
    />
  );
};

export default OrigynFoundationReserve;
