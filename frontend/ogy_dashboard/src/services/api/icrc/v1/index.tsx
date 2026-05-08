import { API_ICRC_V1_BASE_URL } from "@constants/index";
import { createHttpClient } from "@services/api/httpClient";

const instance = createHttpClient({
  baseURL: API_ICRC_V1_BASE_URL,
  timeout: 10_000,
});

export default instance;
