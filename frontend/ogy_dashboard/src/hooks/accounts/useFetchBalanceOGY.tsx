import { useQuery, keepPreviousData } from "@tanstack/react-query";
import fetchBalanceOGY from "@services/queries/accounts/fetchBalanceOGY";

const useFetchBalanceOGY = ({
  owner,
  subaccount,
}: {
  owner: string;
  subaccount: string;
}) => {
  return useQuery({
    queryKey: ["fetchBalanceOGY", owner, subaccount],
    queryFn: () => fetchBalanceOGY({ owner, subaccount }),
    placeholderData: keepPreviousData,
  });
};

export default useFetchBalanceOGY;
