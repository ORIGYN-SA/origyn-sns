import { GLDT_API_TOKEN_SYMBOL } from "@constants/index";

type QueryValue = string | number | boolean | undefined;

export const gldtTokenPath = (
  path: string,
  query?: Record<string, QueryValue>
) => {
  const normalizedPath = path.replace(/^\/+/, "");
  const params = new URLSearchParams();

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined) {
      params.set(key, String(value));
    }
  });

  const queryString = params.toString();
  const tokenPath = `/tokens/${GLDT_API_TOKEN_SYMBOL}/${normalizedPath}`;

  return queryString ? `${tokenPath}?${queryString}` : tokenPath;
};

export const toBigInt = (value: string | number | bigint) => BigInt(value);

export const tokenAmountToE8s = (amount: string | number) => {
  const normalizedAmount =
    typeof amount === "number" ? amount.toFixed(8) : amount;
  const [wholePart, fractionalPart = ""] = normalizedAmount.split(".");
  const e8sFraction = fractionalPart.padEnd(8, "0").slice(0, 8);

  return BigInt(wholePart) * 100_000_000n + BigInt(e8sFraction);
};
