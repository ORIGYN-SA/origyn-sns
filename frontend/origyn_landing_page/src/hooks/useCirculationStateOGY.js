import { useQuery } from "@tanstack/react-query";
import { Actor } from "@dfinity/agent";
import { idlFactory } from "../services/candid/token_metrics";
import { agent } from "../services/icpAgent";

const divideBy1e8 = (n) => n / 1e8;
const roundAndFormatLocale = (n) => Math.round(n).toLocaleString("en-US");

const fetchCirculationState = async () => {
  const canisterId = import.meta.env.VITE_TOKEN_METRICS_CANISTER_ID;
  const actor = Actor.createActor(idlFactory, { agent, canisterId });

  const [supplyData, foundationData, holderData] = await Promise.all([
    actor.get_supply_data(),
    actor.get_foundation_assets(),
    actor.get_holders({ offset: 0, limit: 0, merge_accounts_to_principals: false })
  ]);

  const totalSupply = divideBy1e8(Number(supplyData.total_supply));
  const circulatingSupply = divideBy1e8(Number(supplyData.circulating_supply));
  const totalHolders = Number(holderData.total_count);

  const totalLocked = foundationData.reduce((acc, [, { governance }]) => {
    return acc + divideBy1e8(Number(governance.total_locked));
  }, 0);

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
