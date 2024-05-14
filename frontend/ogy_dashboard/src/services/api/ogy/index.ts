import axios from "axios";
import { API_OGY_BASE_URL } from "@constants/index";

const instance = axios.create({
  baseURL: API_OGY_BASE_URL,
  timeout: 10000,
  //   headers: { "X-Custom-Header": "" },
//   withCredentials: false,
});

export default instance;