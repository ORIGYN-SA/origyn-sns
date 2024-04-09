import axios from "axios";

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_ICRC_V1_BASE_URL,
  timeout: 1000,
  //   headers: { "X-Custom-Header": "foobar" },
  withCredentials: false,
});

export default instance;
