import { useQuery } from "@tanstack/react-query";
import fetchNftCategories from "@services/queries/nft/fetchNftCategories";

const FIVE_MINUTES = 5 * 60 * 1000;

const useNftCategories = () =>
  useQuery({
    queryKey: ["NFT_CATEGORIES"],
    queryFn: fetchNftCategories,
    staleTime: FIVE_MINUTES,
  });

export default useNftCategories;
