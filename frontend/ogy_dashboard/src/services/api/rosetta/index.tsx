import axios from "axios";
import { API_ROSETTA } from "@constants/index";

const instance = axios.create({
  baseURL: API_ROSETTA,
  // timeout: 1000,
  withCredentials: true,
});

export default instance;
