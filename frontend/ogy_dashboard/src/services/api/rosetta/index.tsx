import axios from "axios";
import { API_ROSETTA } from "@constants/index";

const instance = axios.create({
  baseURL: API_ROSETTA,
  timeout: 1000,
  //   headers: { "X-Custom-Header": "" },
  withCredentials: false,
});

export default instance;
