import { useQuery } from "@tanstack/react-query";
import { gldtClient, gldtTokenPath } from "../services/gldt";

const divideBy1e8 = (n) => n / 1e8;
const roundAndFormatLocale = (n) => Math.round(n).toLocaleString("en-US");

const fetchCirculationState = async () => {
  const [supply, foundation, holders] = await Promise.all([
    gldtClient.get(gldtTokenPath("supply/summary")),
    gldtClient.get(gldtTokenPath("foundation/assets")),
    gldtClient.get(gldtTokenPath("holders/list", { limit: 1, merge: false })),
  ]);

  const supplyData = supply.data;
  const foundationData = foundation.data;

  const totalSupply = divideBy1e8(Number(supplyData.total_supply));
  const circulatingSupply = divideBy1e8(Number(supplyData.circulating_supply));
  const totalHolders = Number(holders.data.total_count);

  const totalLocked = foundationData.reduce(
    (acc, { overview: { governance } }) =>
      acc + divideBy1e8(Number(governance.total_locked)),
    0
  );

  return {
    number: {
      circulatingSupply,
      totalSupply,
      totalHolders
    },
    string: {
      circulatingSupply: roundAndFormatLocale(circulatingSupply),
      totalSupply: roundAndFormatLocale(totalSupply),
      totalHolders: roundAndFormatLocale(totalHolders)
    },
    dataPieChart: [
      {
        name: "OGY not in the hand of the Foundation",
        value: circulatingSupply - totalLocked,
        valueToString: roundAndFormatLocale(circulatingSupply - totalLocked),
      },
      {
        name: "OGY locked in the hand of the Foundation",
        value: totalLocked,
        valueToString: roundAndFormatLocale(totalLocked),
      },
    ],
  };
};

const useCirculationStateOGY = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["circulationStateOGY"],
    queryFn: fetchCirculationState,
  });
  return { data, loading: isLoading, error: error?.message ?? null };
};

export default useCirculationStateOGY;
