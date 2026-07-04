import gldtEndpoints from "@services/api/gldt/v1/endpoints";
import { ApiNftItem } from "@services/api/gldt/v1/types";
import { NftListParams } from "@origyn/shared/gldt";

export type FetchNftsParams = NftListParams;

const fetchNfts = async (
  params: FetchNftsParams = {}
): Promise<ApiNftItem[]> => {
  const { items } = await gldtEndpoints.getNfts(params);
  return items ?? [];
};

export default fetchNfts;
