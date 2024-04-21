import { useState, useEffect } from "react";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import fetchFoundationAssetsOGY, {
  FoundationAssetsOGY,
} from "@services/foundation/fetchFoundationAssetsOGYQuery";
import { roundAndFormatLocale } from "@helpers/numbers/index";
import { PieChart } from "@components/charts/pie/Pie";

const useOGYCirculationState = () => {
  const [circulationData, setCirculationData] = useState({
    totalCirculationState: "0",
    totalSupplyLocked: "0",
    totalSupplyUnhand: "0",
    dataPieChart: [] as PieChart[],
  });

  const {
    data: foundationAssets,
    isSuccess: isSuccessFetchFoundationAssets,
    isLoading: isLoadingFoundationAssets,
    error: errorFoundationAssets,
  }: UseQueryResult<FoundationAssetsOGY> = useQuery(
    fetchFoundationAssetsOGY({})
  );

  useEffect(() => {
    if (isSuccessFetchFoundationAssets) {
      const totalSupply = foundationAssets.totalSupply;
      const totalSupplyLocked = foundationAssets.totalSupplyLocked;
      const totalSupplyUnlocked = foundationAssets.totalSupplyUnlocked;
      const totalCirculationState = totalSupply - totalSupplyUnlocked;
      const totalSupplyUnhand = totalCirculationState - totalSupplyLocked;

      setCirculationData({
        totalCirculationState: roundAndFormatLocale({
          number: totalCirculationState,
        }),
        totalSupplyLocked: roundAndFormatLocale({ number: totalSupplyLocked }),
        totalSupplyUnhand: roundAndFormatLocale({ number: totalSupplyUnhand }),
        dataPieChart: [
          {
            name: "OGY not in the hand of the Foundation",
            value: totalSupplyUnhand,
            valueToString: roundAndFormatLocale({ number: totalSupplyUnhand }),
          },
          {
            name: "OGY locked in the hand of the Foundation",
            value: totalSupplyLocked,
            valueToString: roundAndFormatLocale({ number: totalSupplyLocked }),
          },
        ],
      });
    }
  }, [isSuccessFetchFoundationAssets, foundationAssets]);

  const isLoading = isLoadingFoundationAssets;
  const error = errorFoundationAssets;

  return { circulationData, isLoading, error };
};

export default useOGYCirculationState;
