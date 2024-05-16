import axios from "axios";
import { API_LEDGER_BASE_URL } from "@constants/index";

const instance = axios.create({
  baseURL: API_LEDGER_BASE_URL,
  timeout: 1000,
});

export default instance;
