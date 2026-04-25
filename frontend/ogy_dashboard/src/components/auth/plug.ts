import type { Agent } from "@dfinity/agent";
import type { Principal } from "@dfinity/principal";

type PlugConnectArgs = {
  whitelist: string[];
  host: string;
  timeout?: number;
};

type PlugProvider = {
  agent?: Agent;
  requestConnect: (args: PlugConnectArgs) => Promise<boolean>;
  createAgent: (args: {
    whitelist: string[];
    host: string;
  }) => Promise<boolean>;
  isConnected: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  getPrincipal: () => Promise<Principal>;
};

declare global {
  interface Window {
    ic?: {
      plug?: PlugProvider;
    };
  }
}

export const PLUG_INSTALL_URL =
  "https://chromewebstore.google.com/detail/plug/cfbfdhimifdmdehjmkdobpcjfefblkjm";

export const isPlugInstalled = (): boolean =>
  typeof window !== "undefined" && !!window.ic?.plug;

const getPlug = (): PlugProvider => {
  const plug = window.ic?.plug;
  if (!plug) {
    throw new Error("Plug extension is not installed.");
  }
  return plug;
};

export const isPlugConnected = async (): Promise<boolean> => {
  if (!isPlugInstalled()) return false;
  try {
    return await getPlug().isConnected();
  } catch {
    return false;
  }
};

const ensureAgent = async (args: { whitelist: string[]; host: string }) => {
  const plug = getPlug();
  if (!plug.agent) {
    await plug.createAgent({ whitelist: args.whitelist, host: args.host });
  }
};

export const connectPlug = async (args: {
  whitelist: string[];
  host: string;
}): Promise<{ principal: Principal; agent: Agent }> => {
  const plug = getPlug();
  const ok = await plug.requestConnect({
    whitelist: args.whitelist,
    host: args.host,
    timeout: 50_000,
  });
  if (!ok) {
    throw new Error("Plug connection was declined.");
  }
  await ensureAgent(args);
  if (!plug.agent) {
    throw new Error("Plug did not expose an agent after connect.");
  }
  const principal = await plug.getPrincipal();
  return { principal, agent: plug.agent };
};

export const silentReconnectPlug = async (args: {
  whitelist: string[];
  host: string;
}): Promise<{ principal: Principal; agent: Agent } | null> => {
  if (!isPlugInstalled()) return null;
  const plug = getPlug();
  try {
    const connected = await plug.isConnected();
    if (!connected) return null;
    await ensureAgent(args);
    if (!plug.agent) return null;
    const principal = await plug.getPrincipal();
    return { principal, agent: plug.agent };
  } catch (err) {
    console.error("Plug silent reconnect failed:", err);
    return null;
  }
};

export const disconnectPlug = async (): Promise<void> => {
  if (!isPlugInstalled()) return;
  try {
    await getPlug().disconnect();
  } catch {
    /* ignore — Plug sometimes throws on double-disconnect */
  }
};
