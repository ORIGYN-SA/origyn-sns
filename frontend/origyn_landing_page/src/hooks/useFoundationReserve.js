import { useQuery } from "@tanstack/react-query";
import { Actor } from "@dfinity/agent";
import { idlFactory } from "../services/candid/token_metrics";
import { agent } from "../services/icpAgent";

const divideBy1e8 = (n) => n / 1e8;
const roundAndFormatLocale = (n) => Math.round(n).toLocaleString("en-US");

const fetchFoundationReserve = async () => {
  const canisterId = import.meta.env.VITE_TOKEN_METRICS_CANISTER_ID;
  const actor = Actor.createActor(idlFactory, { agent, canisterId });

  const foundationData = await actor.get_foundation_assets();

  const result = foundationData.reduce(
    (acc, [, { governance, total }]) => {
      acc.total_locked += divideBy1e8(Number(governance.total_locked));
      acc.total_rewards += divideBy1e8(Number(governance.total_rewards));
      acc.total_staked += divideBy1e8(Number(governance.total_staked));
      acc.total_unlocked += divideBy1e8(Number(governance.total_unlocked));
      acc.total += divideBy1e8(Number(total));
      return acc;
    },
    { total_locked: 0, total_rewards: 0, total_staked: 0, total_unlocked: 0, total: 0 }
  );

  const { total, total_locked, total_staked } = result;
  const total_unlocked = total - total_locked;

  return {
    number: {
      totalSupply: total,
      totalSupplyLocked: total_locked,
      totalSupplyUnlocked: total_unlocked,
      totalStaked: total_staked,
    },
    string: {
      totalSupply: roundAndFormatLocale(total),
      totalSupplyLocked: roundAndFormatLocale(total_locked),
      totalSupplyUnlocked: roundAndFormatLocale(total_unlocked),
      totalStaked: roundAndFormatLocale(total_staked),
    },
    dataPieChart: [
      {
        name: "Locked",
        value: total_locked,
        valueToString: roundAndFormatLocale(total_locked),
      },
      {
        name: "Unlocked",
        value: total_unlocked,
        valueToString: roundAndFormatLocale(total_unlocked),
      },
    ],
  };
};

const useFoundationReserve = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["foundationReserve"],
    queryFn: fetchFoundationReserve,
  });
  return { data, loading: isLoading, error: error?.message ?? null };
};

export default useFoundationReserve;
