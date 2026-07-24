import { decodeIcrcAccount, encodeIcrcAccount } from "@dfinity/ledger-icrc";
import { Principal } from "@dfinity/principal";

const ORACLE_SUBACCOUNT_PATTERN = /^[0-9a-f]{64}$/i;
const DEFAULT_SUBACCOUNT = "0".repeat(64);

export const asValidPrincipal = (value: string): string | null => {
  const candidate = value.trim().toLowerCase();
  if (!candidate) return null;
  try {
    return Principal.fromText(candidate).toText();
  } catch {
    return null;
  }
};

/** Converts `<principal>.<64hex>` accounts to ICRC-1 text. */
export const toIcrcAccountText = (account: string): string => {
  const trimmed = account.trim();
  const [owner, subaccount, ...rest] = trimmed.split(".");
  if (
    rest.length > 0 ||
    (subaccount !== undefined && !ORACLE_SUBACCOUNT_PATTERN.test(subaccount))
  ) {
    return trimmed;
  }

  try {
    return encodeIcrcAccount({
      owner: Principal.fromText(owner),
      subaccount: subaccount
        ? Uint8Array.from(subaccount.match(/.{2}/g) ?? [], (byte) =>
            Number.parseInt(byte, 16)
          )
        : undefined,
    });
  } catch {
    return trimmed;
  }
};

/** Converts ICRC-1 text to the `<principal>.<64hex>` API format. */
export const toOracleAccount = (account: string): string => {
  const trimmed = account.trim();
  try {
    const { owner, subaccount } = decodeIcrcAccount(trimmed);
    if (!subaccount) return owner.toText();
    const hex = Array.from(subaccount)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
    return `${owner.toText()}.${hex}`;
  } catch {
    return trimmed;
  }
};

export const accountOwner = (account: string): string => {
  const trimmed = account.trim();
  try {
    return decodeIcrcAccount(trimmed).owner.toText();
  } catch {
    return trimmed.split(".", 1)[0] ?? trimmed;
  }
};

export const stripDefaultSubaccount = (account: string): string => {
  const trimmed = account.trim();
  const separator = trimmed.lastIndexOf(".");
  if (separator === -1) return trimmed;

  return trimmed.slice(separator + 1) === DEFAULT_SUBACCOUNT
    ? trimmed.slice(0, separator)
    : trimmed;
};
