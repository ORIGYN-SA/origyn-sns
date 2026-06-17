import { API_GLDT_BASE_URL } from "@constants/index";
import { createHttpClient } from "@services/api/httpClient";

const instance = createHttpClient({
  baseURL: API_GLDT_BASE_URL,
  timeout: 15_000,
});

export default instance;
