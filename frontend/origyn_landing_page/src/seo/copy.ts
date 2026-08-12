// Reads the message catalogs at build time, so the meta tags and the social
// card say exactly what the page says. Loaded from disk rather than imported so
// this stays plain Node code, outside the app bundle.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { defaultLocale, resolveKey, type Locale } from "../i18n/config.ts";

const messagesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../i18n/messages");
const catalogs = new Map<string, unknown>();

const catalog = (locale: string): unknown => {
  if (!catalogs.has(locale)) {
    catalogs.set(locale, JSON.parse(fs.readFileSync(path.join(messagesDir, `${locale}.json`), "utf8")));
  }
  return catalogs.get(locale);
};

// <i>, <s> and <a:…> are RichText's rendering tags (see src/i18n/RichText.tsx),
// not part of the copy.
const stripTags = (value: string): string => value.replace(/<\/?(?:[isg]|a:[a-zA-Z0-9_-]+)>/g, "");

/** A catalog string, falling back to English the way the running app does. */
export const copy = (locale: Locale, key: string): string => {
  const value = resolveKey(catalog(locale), key) ?? resolveKey(catalog(defaultLocale), key);
  if (typeof value !== "string") {
    throw new Error(`src/i18n/messages/${locale}.json has no string at "${key}"`);
  }
  return stripTags(value);
};
