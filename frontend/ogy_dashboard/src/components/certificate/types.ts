// Certificate/template types ported from the ORIGYN Minting Studio
// (b2b-minting-studio frontend) so the dashboard renders certificates with the
// exact same template structure. Trimmed to the fields the viewer consumes.

export type TemplateItemType =
  | "input"
  | "readonly"
  | "badge"
  | "image"
  | "video"
  | "signature";

export interface TemplateItem {
  id: string;
  type: TemplateItemType;
  label: string;
  order: number;
  hidden?: boolean;
  size?: "sm" | "md" | "lg";
}

export interface TemplateSection {
  id: string;
  name: string;
  order: number;
  items: TemplateItem[];
  displayName?: string;
}

export interface TemplateLanguage {
  id: string;
  code: string;
  name: string;
  isDefault?: boolean;
}

export interface TemplateBackground {
  type: "standard" | "custom";
  dataUri?: string;
  mediaType?: "image" | "video";
}

export interface TemplateStructure {
  sections: TemplateSection[];
  languages: TemplateLanguage[];
  background: TemplateBackground;
}

// JSON payload stored in the minting studio canister's template_json field.
export interface TemplateJsonPayload {
  name: string;
  description: string;
  structure: TemplateStructure;
}

export interface LocalizedContent {
  [languageCode: string]: string;
}

export interface DateContent {
  date: number; // Epoch timestamp in milliseconds
}

export interface MetadataFieldValue {
  content: LocalizedContent | DateContent | string;
}

export interface FileReference {
  id: string;
  path: string;
}

export type CertificateDataValue =
  | MetadataFieldValue
  | FileReference[]
  | string;

export interface Certificate {
  id: string;
  name?: string;
  description?: string;
  certified_by?: string;
  data: Record<string, CertificateDataValue | undefined>;
}
