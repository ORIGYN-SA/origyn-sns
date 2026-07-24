import {
  createGldtClient,
  createGldtEndpoints,
  makeTokenPath,
} from "@origyn/shared-ui/gldt";

export const gldtClient = createGldtClient(
  import.meta.env.VITE_API_GLDT_BASE_URL,
);

export const gldtTokenPath = makeTokenPath("OGY");

export const gldtEndpoints = createGldtEndpoints(gldtClient, {
  tokenSymbol: "OGY",
});
