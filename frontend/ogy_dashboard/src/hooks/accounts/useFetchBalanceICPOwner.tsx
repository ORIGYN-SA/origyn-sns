import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useWallet } from "@components/auth/useWallet";
import fetchOwnerBalanceICP from "@services/queries/accounts/fetchOwnerBalanceICP";

const useFetchBalanceICPOwner = () => {
  const {
    principalId: owner,
    isConnected,
    subAccount,
    subAccountHex,
  } = useWallet();

  return useQuery({
    queryKey: ["userFetchBalanceICP", owner, subAccountHex, isConnected],
    queryFn: async () =>
      fetchOwnerBalanceICP({ owner: owner as string, subAccount }),
    placeholderData: keepPreviousData,
    enabled: !!isConnected && !!owner,
  });
};

export default useFetchBalanceICPOwner;
