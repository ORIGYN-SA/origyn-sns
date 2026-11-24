import { AccountIdentifier } from "@dfinity/ledger-icp";
import { decodeIcrcAccount, encodeIcrcAccount } from "@dfinity/ledger-icrc";
import { Principal } from "@dfinity/principal";

/** Where an ICP-side transfer goes: an ICRC-1 account, or (ICP only) a legacy account identifier. */
export type IcpRecipient =
  | { kind: "icrc"; owner: Principal; subaccount: Uint8Array | undefined; text: string }
  | { kind: "accountId"; id: AccountIdentifier; text: string };

/** A principal or ICRC-1 account text (`principal-checksum.subaccount`). */
export const parseIcrcAccount = (text: string): IcpRecipient | null => {
  const t = text.trim();
  if (!t) return null;
  try {
    const a = decodeIcrcAccount(t);
    const subaccount = a.subaccount ? Uint8Array.from(a.subaccount) : undefined;
    return { kind: "icrc", owner: a.owner, subaccount, text: encodeIcrcAccount({ owner: a.owner, subaccount }) };
  } catch {
    return null;
  }
};

/** A 64-hex legacy ICP account identifier, checksum included. */
export const parseAccountId = (text: string): IcpRecipient | null => {
  const t = text.trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(t)) return null;
  try {
    const id = AccountIdentifier.fromHex(t);
    return id.toHex() === t ? { kind: "accountId", id, text: t } : null;
  } catch {
    return null;
  }
};

/** A principal and an optional subaccount in hex (up to 32 bytes, left-padded with zeros). */
export const parsePrincipalAndSub = (principal: string, sub: string): IcpRecipient | null => {
  const s = sub.trim().toLowerCase();
  if (s !== "" && !/^[0-9a-f]{1,64}$/.test(s)) return null;
  let owner: Principal;
  try {
    owner = Principal.fromText(principal.trim());
  } catch {
    return null;
  }
  const padded = s.padStart(64, "0");
  const bytes = Uint8Array.from(padded.match(/../g) ?? [], (h) => parseInt(h, 16));
  const subaccount = bytes.some((b) => b !== 0) ? bytes : undefined;
  return { kind: "icrc", owner, subaccount, text: encodeIcrcAccount({ owner, subaccount }) };
};

/** An ICRC-1 account split back into principal and subaccount hex, for the other input mode. */
export const splitAccount = (r: IcpRecipient): { principal: string; sub: string } =>
  r.kind === "icrc"
    ? {
        principal: r.owner.toText(),
        sub: r.subaccount ? Array.from(r.subaccount, (b) => b.toString(16).padStart(2, "0")).join("").replace(/^0+/, "") : "",
      }
    : { principal: "", sub: "" };
