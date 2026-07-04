type QueryValue = string | number | boolean | undefined;

const withQuery = (
  basePath: string,
  query?: Record<string, QueryValue>,
): string => {
  const params = new URLSearchParams();

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined) {
      params.set(key, String(value));
    }
  });

  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
};

export const makeTokenPath =
  (tokenSymbol: string) =>
  (path: string, query?: Record<string, QueryValue>) => {
    const normalizedPath = path.replace(/^\/+/, "");
    return withQuery(`/tokens/${tokenSymbol}/${normalizedPath}`, query);
  };

// Builds /nft/{env} paths for the GLDT NFT API.
export const makeNftPath =
  (env: string) => (path: string, query?: Record<string, QueryValue>) => {
    const normalizedPath = path.replace(/^\/+/, "");
    return withQuery(`/nft/${env}/${normalizedPath}`, query);
  };

export const toBigInt = (value: string | number | bigint) => BigInt(value);

export const tokenAmountToE8s = (amount: string | number) => {
  const normalizedAmount =
    typeof amount === "number" ? amount.toFixed(8) : amount;
  const [wholePart, fractionalPart = ""] = normalizedAmount.split(".");
  const e8sFraction = fractionalPart.padEnd(8, "0").slice(0, 8);

  return BigInt(wholePart) * 100_000_000n + BigInt(e8sFraction);
};
