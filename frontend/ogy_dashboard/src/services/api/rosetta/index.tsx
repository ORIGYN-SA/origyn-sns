import { API_ROSETTA } from "@constants/index";
import { createHttpClient } from "@services/api/httpClient";

const instance = createHttpClient({
  baseURL: API_ROSETTA,
  timeout: 5000,
});

export default instance;
