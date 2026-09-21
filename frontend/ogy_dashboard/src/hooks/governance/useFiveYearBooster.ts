import { useQuery } from "@tanstack/react-query";
import fetchFiveYearBooster from "@services/api/gldt/v1/fetchFiveYearBooster";

export default function useFiveYearBooster() {
  return useQuery({
    queryKey: ["fiveYearBooster"],
    queryFn: fetchFiveYearBooster,
    staleTime: 5 * 60 * 1000,
  });
}
