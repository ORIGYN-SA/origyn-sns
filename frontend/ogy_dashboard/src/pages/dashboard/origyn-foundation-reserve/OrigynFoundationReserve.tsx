import { useMemo, useState, useEffect } from "react";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { Card } from "@components/ui";
import PieChart from "@components/charts/pie/Pie";
import fetchFoundationAssetsOGY, {
  FoundationAssetsOGY,
} from "@services/queries/foundation/fetchFoundationAssetsOGYQuery";
import { PieChart as PieChartTypes } from "@services/types/charts.types";
import { usePieChart } from "@components/charts/pie/context";
import { TooltipInfo } from "@components/ui";

type OrigynFoundationReserve = {
  className?: string;
};

const OrigynFoundationReserve = ({
  className,
  ...restProps
}: OrigynFoundationReserve) => {
  const [totalSupply, setTotalSupply] = useState("0");
  const [totalSupplyStaked, setTotalSupplyStaked] = useState("0");
  const [totalSupplyVested, setTotalSupplyVested] = useState("0");
  const [dataPieChart, setDataPieChart] = useState([] as Array<PieChartTypes>);
  const colors = useMemo(() => ["#ff55c5", "#90306f"], []);
  const infos = useMemo(
    () => [
      {
        id: "tooltip-amount-locked",
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
        value: "Unlocked found owned by ORIGYN foundation.",
      },
    ],
    []
  );
  const { activeIndex, setActiveIndex } = usePieChart();

  const {
    data: foundationAssets,
    isSuccess,
  }: UseQueryResult<FoundationAssetsOGY> = useQuery(
    fetchFoundationAssetsOGY({})
  );

  useEffect(() => {
    if (isSuccess) {
      setTotalSupply(foundationAssets.totalSupplyToString);
      setDataPieChart(foundationAssets.dataPieChart);
      setTotalSupplyStaked(foundationAssets.totalLockedStakedToString);
      setTotalSupplyVested(foundationAssets.totalLockedVestedToString);
    }
  }, [isSuccess, foundationAssets]);

  return (
    <Card className={`${className}`} {...restProps}>
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">OGY Foundation Reserve</div>
        <TooltipInfo id="tooltip-amount-foundation">
          Total amount of OGY tokens owned by ORIGYN foundation across all
          wallets.
        </TooltipInfo>
      </div>

      <div className="mt-6 h-80 rounded-xl">
        <PieChart data={dataPieChart} colors={colors} />
      </div>
      <div className="flex flex-col items-center my-4">
        <h2 className="text-lg font-semibold text-content/60">
          Total Foundation Supply
        </h2>
        <div className="mt-4 flex items-center text-2xl font-semibold">
          <img src="/ogy_logo.svg" alt="OGY Logo" />
          <span className="ml-2 mr-3">{totalSupply}</span>
          <span className="text-content/60">OGY</span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {dataPieChart.map(({ name, valueToString }, index) => (
          <Card
            className={`bg-surface-2/40 dark:bg-surface-2 mt-8 pb-8 dark:hover:bg-white/10 hover:bg-black/5 ${
              activeIndex === index ? `dark:bg-white/10 bg-black/5` : ``
            } transition-opacity duration-300`}
            key={name}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center text-lg">
                <div
                  className="h-3 w-3 rounded-full mr-2"
                  style={{ backgroundColor: colors[index] }}
                ></div>
                <span className="text-content/60">{name}</span>
              </div>
              <TooltipInfo id={infos[index].id}>
                {infos[index].value}
              </TooltipInfo>
            </div>
            <div className="flex items-center mt-4 text-2xl font-semibold">
              <span className="mr-3">{valueToString}</span>
              <span className="text-content/60">OGY</span>
            </div>
            <Card.BorderBottom color={colors[index]} />
          </Card>
        ))}
      </div>
      <div className="mt-8">
        <div className="text-center">ORIGYN FOUNDATION LOCKED TOKENS</div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 text-center mt-4">
          <div>
            <span>Staked tokens </span>
            <span>{totalSupplyStaked} OGY</span>
          </div>
          <div>
            <span>Vested tokens </span>
            <span>{totalSupplyVested} OGY</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default OrigynFoundationReserve;
