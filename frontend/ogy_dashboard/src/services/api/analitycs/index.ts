import axios from "axios";
import { API_PLAUSIBLE_BASE_URL, PLAUSIBLE_API_KEY } from "@constants/index";

const instance = axios.create({
  baseURL: API_PLAUSIBLE_BASE_URL,
  timeout: 1000,
  // headers: { "Authorization": `Bearer ${PLAUSIBLE_API_KEY}` },
  withCredentials: false,
});

export default instance;
