const stringify = (value: unknown) => {
  try {
    return JSON.stringify(value, (_key, item) =>
      typeof item === "bigint" ? item.toString() : item
    );
  } catch {
    return String(value);
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const formatVariantError = (value: unknown): string => {
  if (!isRecord(value)) return String(value);

  const [key] = Object.keys(value);
  if (!key) return "Unknown error";

  const payload = value[key];
  if (payload === null || typeof payload === "undefined") return key;
  if (typeof payload === "string") return `${key}: ${payload}`;

  return `${key}: ${stringify(payload)}`;
};

export const requireVariant = <T>(
  value: unknown,
  successKey: string,
  context: string
): T => {
  if (isRecord(value) && successKey in value) {
    return value[successKey] as T;
  }

  throw new Error(`${context}: ${formatVariantError(value)}`);
};
