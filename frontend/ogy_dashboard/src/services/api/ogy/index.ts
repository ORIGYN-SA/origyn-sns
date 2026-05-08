import { API_OGY_BASE_URL } from "@constants/index";
import { createHttpClient } from "@services/api/httpClient";

const instance = createHttpClient({
  baseURL: API_OGY_BASE_URL,
});

export default instance;
