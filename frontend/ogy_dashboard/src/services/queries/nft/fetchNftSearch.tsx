import gldtEndpoints from "@services/api/gldt/v1/endpoints";
import { ApiNftSearchResults } from "@services/api/gldt/v1/types";
import { NftSearchParams } from "@origyn/shared/gldt";

export type FetchNftSearchParams = NftSearchParams;

const fetchNftSearch = async (
  params: FetchNftSearchParams
): Promise<ApiNftSearchResults> => {
  const data = await gldtEndpoints.getNftSearch(params);
  return {
    collections: data.collections ?? [],
    nfts: data.nfts ?? [],
    accounts: data.accounts ?? [],
  };
};

export default fetchNftSearch;
