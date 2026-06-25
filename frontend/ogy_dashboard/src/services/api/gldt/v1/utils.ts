import { makeTokenPath } from "@origyn/shared/gldt";
import { GLDT_API_TOKEN_SYMBOL } from "@constants/index";

export const gldtTokenPath = makeTokenPath(GLDT_API_TOKEN_SYMBOL);
export { toBigInt, tokenAmountToE8s } from "@origyn/shared/gldt";
