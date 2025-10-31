import { useQuery } from "@tanstack/react-query";
import { getActor } from "@amerej/artemis-react";

const isWhitelisted = async (): Promise<boolean> => {
  const actor = await getActor("OGYTokenSwap", { isAnon: false });
  const isWhitelisted = await actor.is_caller_whitelisted();

  return isWhitelisted as boolean;
};

const useIsWhitelisted = () => {
  return useQuery<boolean>({
    queryKey: ["isWhitelisted"],
    queryFn: () => isWhitelisted(),
  });
};

export default useIsWhitelisted;
