import { createHttpClient } from "../http";

export const createGldtClient = (
  baseUrl: string | undefined,
  timeout = 15_000
) => {
  const normalizedBaseUrl = baseUrl?.trim();

  if (!normalizedBaseUrl) {
    throw new Error("Missing GLDT API base URL");
  }

  return createHttpClient({ baseURL: normalizedBaseUrl, timeout });
};
