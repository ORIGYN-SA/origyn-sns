import {
  ApiNftAccountItem,
  ApiNftHit,
  ApiNftItem,
  ApiNftMetadata,
  ApiNftOwnedItem,
} from "@services/api/gldt/v1/types";
import {
  Certificate,
  TemplateItem,
  TemplateStructure,
} from "@origyn/shared-ui/certificate";

type NftLike = ApiNftItem | ApiNftHit | ApiNftAccountItem | ApiNftOwnedItem;

interface NftCollectionRef {
  canister_id: string;
  name: string | null;
}

export interface NftCard {
  id: string;
  canisterId: string;
  tokenId: string;
  name: string;
  collectionName: string | null;
  imageUrl: string | null;
  issuer: string | null;
  description: string | null;
  mintedAtMs: number | null;
  ownerAccount: string | null;
  // Gallery image urls, excluding the main image.
  gallery: string[];
  // Raw certificate JSON for the template viewer.
  metadata: ApiNftMetadata | null;
}

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() !== "" ? value.trim() : null;

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

// File fields in the certificate JSON are arrays of { id, path }.
const readFilePaths = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => readString(readRecord(entry)?.["path"]))
    .filter((path): path is string => path !== null);
};

// The issuer key location varies per collection.
const extractIssuer = (metadata?: ApiNftMetadata | null): string | null => {
  if (!metadata) return null;
  const root = readString(metadata["certified_by"]);
  if (root) return root;
  return readString(readRecord(metadata["data"])?.["certified_by"]);
};

const extractGallery = (
  metadata: ApiNftMetadata | null | undefined,
  mainImageUrl: string | null
): string[] => {
  const data = readRecord(metadata?.["data"]);
  if (!data) return [];
  const paths = readFilePaths(data["gallery_images"]);
  return [...new Set(paths)].filter((path) => path !== mainImageUrl);
};

export const collectionNamesById = (
  collections?: NftCollectionRef[]
): Map<string, string> => {
  const names = new Map<string, string>();
  for (const collection of collections ?? []) {
    const name = readString(collection.name);
    if (name) names.set(collection.canister_id, name);
  }
  return names;
};

export const toNftCard = (
  nft: NftLike,
  collectionNames?: Map<string, string>
): NftCard => {
  const imageUrl = readString(nft.image_url);
  const ownerAccount =
    "owner_account" in nft
      ? readString(nft.owner_account)
      : "current_owner" in nft
        ? readString(nft.current_owner)
        : null;

  return {
    id: `${nft.collection}:${nft.token_id}`,
    canisterId: nft.collection,
    tokenId: nft.token_id,
    name: readString(nft.name) ?? `#${nft.token_id}`,
    collectionName: collectionNames?.get(nft.collection) ?? null,
    imageUrl,
    issuer: extractIssuer(nft.metadata),
    description: readString(nft.description),
    mintedAtMs: "minted_at_ms" in nft ? nft.minted_at_ms : null,
    ownerAccount,
    gallery: extractGallery(nft.metadata, imageUrl),
    metadata: nft.metadata ?? null,
  };
};

// The Minting Studio marks private items on the template; shared-ui's type
// doesn't carry the flag.
type StudioTemplateItem = TemplateItem & { private?: boolean };

// Private values are stored encrypted in `metadata.private` and only the
// gateway can open them, so every public reader sees them locked.
const lockedPrivateFields = (
  metadata: ApiNftMetadata,
  data: Record<string, unknown>,
  template: TemplateStructure,
  message: string
): Certificate["fieldStates"] => {
  if (!readRecord(metadata["private"])) return undefined;
  const fieldStates: NonNullable<Certificate["fieldStates"]> = {};
  for (const section of template.sections) {
    for (const item of section.items as StudioTemplateItem[]) {
      if (item.private && !Object.hasOwn(data, item.id)) {
        fieldStates[item.id] = { locked: true, message };
      }
    }
  }
  return fieldStates;
};

// Maps the API metadata blob to the Minting Studio Certificate shape.
export const toCertificate = (
  nft: NftCard,
  template: TemplateStructure,
  lockedMessage: string
): Certificate => {
  const metadata = nft.metadata ?? {};
  const data = readRecord(metadata["data"]) ?? {};

  return {
    id: nft.tokenId,
    name: readString(metadata["name"]) ?? nft.name,
    description: readString(metadata["description"]) ?? undefined,
    certified_by: nft.issuer ?? undefined,
    data: data as Certificate["data"],
    fieldStates: lockedPrivateFields(metadata, data, template, lockedMessage),
  };
};

export const nftBlockchainUrl = (canisterId: string): string =>
  `https://dashboard.internetcomputer.org/canister/${canisterId}`;
