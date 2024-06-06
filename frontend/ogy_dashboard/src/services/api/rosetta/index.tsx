import axios from "axios";
import { API_ROSETTA } from "@constants/index";

const instance = axios.create({
  baseURL: API_ROSETTA,
  timeout: 1000,
  // headers: {
  //   "Access-Control-Allow-Origin": "*",
  //   "Access-Control-Allow-Methods": "POST",
  //   "Access-Control-Allow-Credentials": "true",
  //   "Content-Type": "application/json",
  //   "Access-Control-Allow-Headers": "Content-Type",
  // },
  withCredentials: true,
});

export default instance;
