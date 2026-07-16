import gldtEndpoints from "@services/api/gldt/v1/endpoints";
import { ApiNftItemsResponse } from "@services/api/gldt/v1/types";
import { NftListParams } from "@origyn/shared/gldt";

export type FetchNftsParams = NftListParams;

const fetchNfts = (params: FetchNftsParams = {}): Promise<ApiNftItemsResponse> =>
  gldtEndpoints.getNfts(params);

export default fetchNfts;
