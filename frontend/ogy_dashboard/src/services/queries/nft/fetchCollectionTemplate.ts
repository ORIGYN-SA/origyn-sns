import {
  TemplateJsonPayload,
  TemplateStructure,
} from "@origyn/shared-ui/certificate";

const fetchCollectionTemplate = async (
  templateUrl: string
): Promise<TemplateStructure | null> => {
  const response = await fetch(templateUrl);

  if (!response.ok) return null;

  try {
    const payload: TemplateJsonPayload = await response.json();
    return payload.structure ?? null;
  } catch {
    return null;
  }
};

export default fetchCollectionTemplate;
