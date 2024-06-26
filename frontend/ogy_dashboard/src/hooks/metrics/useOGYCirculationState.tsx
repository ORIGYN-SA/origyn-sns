import { useState, useEffect } from "react";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import fetchFoundationAssetsOGY, {
  FoundationAssetsOGY,
} from "@services/queries/foundation/fetchFoundationAssetsOGYQuery";
import { roundAndFormatLocale } from "@helpers/numbers/index";
import { PieChartData } from "@components/charts/pie/Pie";

const useOGYCirculationState = () => {
  const [circulationData, setCirculationData] = useState({
    totalCirculationState: "0",
    totalSupplyLocked: "0",
    totalSupplyUnhand: "0",
    dataPieChart: [] as PieChartData[],
  });

  const {
    data: foundationAssets,
    isSuccess: isSuccessFetchFoundationAssets,
    isLoading: isLoadingFoundationAssets,
    isError: isErrorFoundationAssets,
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

  const isSuccess = isSuccessFetchFoundationAssets;
  const isError = isErrorFoundationAssets;
  const isLoading = isLoadingFoundationAssets;
  const error = errorFoundationAssets;

  return { data: circulationData, isSuccess, isError, isLoading, error };
};

export default useOGYCirculationState;
