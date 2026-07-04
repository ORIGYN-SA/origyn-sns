import gldtEndpoints from "@services/api/gldt/v1/endpoints";

const fetchNftCategories = (): Promise<string[]> =>
  gldtEndpoints.getNftCategories();

export default fetchNftCategories;
