import { useQuery } from "@tanstack/react-query";
import { getActor } from "@services/actor";

const isWhitelisted = async (): Promise<boolean> => {
  const actor = await getActor("OGYTokenSwap", { isAnon: false });
  const isWhitelisted = await actor.is_caller_whitelisted();

  return isWhitelisted as boolean;
};

const useIsWhitelisted = (principalId: string | undefined) => {
  return useQuery<boolean>({
    queryKey: ["isWhitelisted", principalId],
    queryFn: () => isWhitelisted(),
    enabled: !!principalId,
  });
};

export default useIsWhitelisted;
