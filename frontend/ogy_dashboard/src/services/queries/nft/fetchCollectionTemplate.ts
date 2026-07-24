import { Principal } from "@dfinity/principal";
import { getActor } from "@services/actor";
import {
  TemplateJsonPayload,
  TemplateStructure,
} from "@origyn/shared-ui/certificate";

interface CollectionInfo {
  owner: Principal;
  metadata: { template_id: bigint };
}

interface Template {
  template_id: bigint;
  template_json: string;
}

type GetTemplateResult = { Ok: Template } | { Err: unknown };

// Resolves a collection's certificate template from the Minting Studio
// canister. Returns null when the collection has no template there, so
// callers can fall back to a simpler rendering.
const fetchCollectionTemplate = async (
  collectionCanisterId: string
): Promise<TemplateStructure | null> => {
  const actor = await getActor("mintingStudio", { isAnon: true });

  const collectionResult: [] | [CollectionInfo] =
    await actor.get_collection_info({
      CanisterId: Principal.fromText(collectionCanisterId),
    });

  if (collectionResult.length === 0) return null;

  const templateId = collectionResult[0].metadata.template_id;

  const templateResult: GetTemplateResult = await actor.get_template_by_id({
    template_id: templateId,
  });

  if (!("Ok" in templateResult)) return null;

  try {
    const payload: TemplateJsonPayload = JSON.parse(
      templateResult.Ok.template_json
    );
    return payload.structure ?? null;
  } catch {
    return null;
  }
};

export default fetchCollectionTemplate;
