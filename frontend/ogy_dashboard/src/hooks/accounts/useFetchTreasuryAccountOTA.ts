import { useQuery, keepPreviousData } from "@tanstack/react-query";
import gldtEndpoints from "@services/api/gldt/v1/endpoints";
import { divideBy1e8, roundAndFormatLocale } from "@helpers/numbers";

const FIVE_MINUTES = 5 * 60 * 1000;

const formatE8s = (value?: string) =>
  value === undefined
    ? undefined
    : roundAndFormatLocale({ number: divideBy1e8(value) });

// Network revenue in OGY is the cumulative burn, since OGY fees are burned. The
// ICP leg is the sum of the two legacy network-fee accounts.
const useFetchTreasuryAccountOTA = () => {
  const query = useQuery({
    queryKey: ["fetchTreasuryAccountOTA"],
    queryFn: () => gldtEndpoints.getOtaBalance(),
    placeholderData: keepPreviousData,
    staleTime: FIVE_MINUTES,
  });

  return {
    ...query,
    ogy: formatE8s(query.data?.ogy_total_burned),
    icp: formatE8s(query.data?.icp_network_revenue),
  };
};

export default useFetchTreasuryAccountOTA;
