import { useEffect, useRef, useState } from "react";
import type { Agent } from "@dfinity/agent";
import type { Principal } from "@dfinity/principal";

import { setAuthedAgent } from "@services/actor";
import { silentReconnectPlug } from "./plug";

type PlugSession = { principal: Principal; agent: Agent };

export const useSyncAuthedAgent = (agent: Agent | undefined) => {
  useEffect(() => {
    setAuthedAgent(agent);
    return () => setAuthedAgent(undefined);
  }, [agent]);
};

export const usePlugSilentReconnect = ({
  enabled,
  shouldAttempt,
  whitelist,
  host,
  onSession,
  onMiss,
}: {
  enabled: boolean;
  shouldAttempt: () => boolean;
  whitelist: string[];
  host: string;
  onSession: (session: PlugSession) => void;
  onMiss: () => void;
}) => {
  const didAttempt = useRef(false);
  const shouldAttemptRef = useRef(shouldAttempt);
  const onSessionRef = useRef(onSession);
  const onMissRef = useRef(onMiss);
  shouldAttemptRef.current = shouldAttempt;
  onSessionRef.current = onSession;
  onMissRef.current = onMiss;

  const [isRestoring, setIsRestoring] = useState(() => shouldAttempt());

  useEffect(() => {
    if (didAttempt.current) return;
    if (!enabled) return;
    didAttempt.current = true;
    if (!shouldAttemptRef.current()) {
      setIsRestoring(false);
      return;
    }
    setIsRestoring(true);
    silentReconnectPlug({ whitelist, host })
      .then((session) => {
        if (session) onSessionRef.current(session);
        else onMissRef.current();
      })
      .finally(() => setIsRestoring(false));
  }, [enabled, whitelist, host]);

  return { isRestoring };
};
