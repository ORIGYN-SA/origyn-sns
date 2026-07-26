import { TemplateStructure } from "@origyn/shared-ui/certificate";
import gldtEndpoints from "@services/api/gldt/v1/endpoints";
import { HttpError } from "@services/api/httpClient";

const fetchCollectionTemplate = async (
  canisterId: string
): Promise<TemplateStructure | null> => {
  try {
    const template = await gldtEndpoints.getNftCollectionTemplate(canisterId);
    return template.structure ?? null;
  } catch (error) {
    if ((error as HttpError | null)?.status === 404) return null;
    throw error;
  }
};

export default fetchCollectionTemplate;
