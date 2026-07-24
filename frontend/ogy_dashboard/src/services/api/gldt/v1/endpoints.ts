import { createGldtEndpoints } from "@origyn/shared-ui/gldt";
import { GLDT_API_TOKEN_SYMBOL, GLDT_NFT_ENV } from "@constants/index";
import gldtAPI from "./index";

const gldtEndpoints = createGldtEndpoints(gldtAPI, {
  tokenSymbol: GLDT_API_TOKEN_SYMBOL,
  nftEnv: GLDT_NFT_ENV,
});

export default gldtEndpoints;
