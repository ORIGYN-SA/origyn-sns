import axios from "axios";
import { API_ICRC_V1_BASE_URL } from "@constants/index";

const instance = axios.create({
  baseURL: API_ICRC_V1_BASE_URL,
  timeout: 1000,
  //   headers: { "X-Custom-Header": "" },
  withCredentials: false,
});

export default instance;
