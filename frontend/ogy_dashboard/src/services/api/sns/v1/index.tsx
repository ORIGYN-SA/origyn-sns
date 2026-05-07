import { API_SNS_BASE_URL } from "@constants/index";
import { createHttpClient } from "@services/api/httpClient";

const instance = createHttpClient({
  baseURL: API_SNS_BASE_URL,
  timeout: 1000,
});

export default instance;
