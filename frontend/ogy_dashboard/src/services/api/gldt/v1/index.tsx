import { createGldtClient } from "@origyn/shared/gldt";
import { API_GLDT_BASE_URL } from "@constants/index";

const instance = createGldtClient(API_GLDT_BASE_URL);

export default instance;
