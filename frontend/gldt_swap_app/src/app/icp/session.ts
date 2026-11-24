import { useMemo } from "react";
import { useAtomValue } from "jotai";
import type { Agent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";

import { stateAtom } from "@auth/atoms";

/** The Internet Computer side of the session: an anonymous agent for queries, and once the user has
 * logged in, their principal and the signer's agent for updates. */
export type IcpSession =
  | { kind: "anonymous"; anon: Agent }
  | { kind: "signedIn"; anon: Agent; signer: Agent; principal: Principal };

export const useIcpSession = (): IcpSession | null => {
  const s = useAtomValue(stateAtom);
  return useMemo(() => {
    const anon = s.unauthenticatedAgent;
    if (!anon) return null;
    if (s.isConnected && s.authenticatedAgent && s.principalId) {
      return {
        kind: "signedIn",
        anon,
        signer: s.authenticatedAgent,
        principal: Principal.fromText(s.principalId),
      };
    }
    return { kind: "anonymous", anon };
  }, [s.unauthenticatedAgent, s.authenticatedAgent, s.isConnected, s.principalId]);
};
