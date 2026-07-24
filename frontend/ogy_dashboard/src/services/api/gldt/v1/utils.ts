import { makeTokenPath, makeNftPath } from "@origyn/shared-ui/gldt";
import { GLDT_API_TOKEN_SYMBOL, GLDT_NFT_ENV } from "@constants/index";

export const gldtTokenPath = makeTokenPath(GLDT_API_TOKEN_SYMBOL);
export const gldtNftPath = makeNftPath(GLDT_NFT_ENV);
export { toBigInt, tokenAmountToE8s } from "@origyn/shared-ui/gldt";
