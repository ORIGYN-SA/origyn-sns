import axios from "axios";
import { API_ROSETTA } from "@constants/index";

const instance = axios.create({
  baseURL: API_ROSETTA,
  withCredentials: false,
  timeout: 5000,
});

export default instance;
