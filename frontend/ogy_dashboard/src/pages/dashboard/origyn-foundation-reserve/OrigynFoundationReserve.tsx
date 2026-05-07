import { useMemo } from "react";
import { TooltipInfo } from "@components/ui";
import { PieStatsCard } from "@components/dashboard";
import useFoundationReserve from "@hooks/metrics/useFoundationReserve";

type OrigynFoundationReserveProps = {
  className?: string;
};

const COLORS = ["#ff55c5", "#90306f"];

const OrigynFoundationReserve = ({
  className,
}: OrigynFoundationReserveProps) => {
  const infos = useMemo(
    () => [
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
              2) Vestings- Tokens that are not receiving any rewards and they
              cant participate in voting.
            </p>
            <p>
              Those tokens were locked by your contract with the ORIGYN
              Foundation.
            </p>
          </div>
        ),
      },
      {
        id: "tooltip-amount-unlocked",
        name: "Unlocked",
        value: "Unlocked found owned by ORIGYN foundation.",
      },
    ],
    []
  );

  const { data: foundationAssets, isLoading, isError } = useFoundationReserve();

  return (
    <PieStatsCard
      className={className}
      title="OGY Foundation Reserve"
      titleTooltip={
        <TooltipInfo id="tooltip-amount-foundation">
          Total amount of OGY tokens owned by ORIGYN foundation across all
          wallets.
        </TooltipInfo>
      }
      data={foundationAssets?.dataPieChart}
      colors={COLORS}
      infos={infos}
      totalLabel="Total Foundation Supply"
      totalValue={foundationAssets?.string.totalSupply}
      loading={isLoading}
      isError={isError}
    />
  );
};

export default OrigynFoundationReserve;
