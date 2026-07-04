import {
  Certificate,
  DateContent,
  FileReference,
  LocalizedContent,
  MetadataFieldValue,
} from "./types";

const isDateContent = (
  content: LocalizedContent | DateContent | string
): content is DateContent =>
  typeof content === "object" &&
  content !== null &&
  "date" in content &&
  typeof (content as DateContent).date === "number";

const isLocalizedContent = (
  content: LocalizedContent | DateContent | string
): content is LocalizedContent =>
  typeof content === "object" && content !== null && !("date" in content);

export const getLocalizedText = (
  value: Certificate["data"][string],
  language = "en"
): string | null => {
  if (typeof value === "string") return value;

  if (value && typeof value === "object" && "content" in value) {
    const content = (value as MetadataFieldValue).content;

    if (isDateContent(content) && content.date) {
      return new Date(content.date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }

    if (isLocalizedContent(content)) {
      if (content[language]) return content[language];
      if (content["en"]) return content["en"];
      const keys = Object.keys(content);
      if (keys.length > 0) return content[keys[0]];
    }

    if (typeof content === "string") return content;
  }

  return null;
};

// Chunked assets (>2MB) served via .raw.icp0.io fail with HTTP/2 protocol
// errors; the non-raw boundary-node URL reassembles chunks correctly.
export const getNonRawUrl = (url: string): string | null => {
  if (!url?.includes(".raw.icp0.io")) return null;
  return url.replace(".raw.icp0.io", ".icp0.io");
};

export function getImageFromCertificate(value: unknown): string | undefined {
  if (!value) return undefined;

  if (typeof value === "string") return value;

  if (Array.isArray(value) && value.length > 0) {
    const first = value[0];
    if (first && typeof first === "object" && "path" in first) {
      const fileRef = first as FileReference;
      return getNonRawUrl(fileRef.path) ?? fileRef.path;
    }
    return undefined;
  }

  if (typeof value === "object" && value !== null && "path" in value) {
    const fileRef = value as FileReference;
    return getNonRawUrl(fileRef.path) ?? fileRef.path;
  }

  return undefined;
}
