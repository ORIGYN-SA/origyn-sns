import { createGldtClient, makeTokenPath } from "@origyn/shared/gldt";

export const gldtClient = createGldtClient(
  import.meta.env.VITE_API_GLDT_BASE_URL
);

export const gldtTokenPath = makeTokenPath("OGY");
