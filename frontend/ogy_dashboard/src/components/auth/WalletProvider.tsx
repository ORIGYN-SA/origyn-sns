import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Agent } from "@dfinity/agent";
import { AccountIdentifier, type SubAccount } from "@dfinity/ledger-icp";
import { Principal } from "@dfinity/principal";
import {
  useAuth,
  useAgent,
  useIsInitializing,
} from "@nfid/identitykit/react";
import { InternetIdentity, OISY } from "@nfid/identitykit";

import {
  IC_HOST,
  setAuthedAgent,
  whitelistedCanisterIds,
} from "@services/actor";
import {
  connectPlug,
  disconnectPlug,
  silentReconnectPlug,
} from "./plug";

export const WalletState = {
  Idle: "Idle",
  OpenWalletList: "OpenWalletList",
  Connecting: "Connecting",
  Connected: "Connected",
} as const;
export type WalletStateValue = (typeof WalletState)[keyof typeof WalletState];

export type WalletId = "dfinity" | "plug" | "oisy";

export type WalletListItem = {
  id: WalletId;
  name: string;
  icon: string;
};

export const WALLET_LIST: WalletListItem[] = [
  {
    id: "dfinity",
    name: "Internet Identity",
    icon: InternetIdentity.icon ?? "",
  },
  {
    id: "plug",
    name: "Plug",
    icon: "https://plugwallet.ooo/assets/images/logo.svg",
  },
  { id: "oisy", name: "OISY", icon: OISY.icon ?? "" },
];

type ContextValue = {
  state: WalletStateValue;
  walletState: typeof WalletState;
  isConnected: boolean;
  isConnecting: boolean;
  isRestoring: boolean;
  principalId: string | undefined;
  accountId: string | undefined;
  subAccount: SubAccount | undefined;
  subAccountHex: string | undefined;
  walletSelected: WalletId | undefined;
  walletList: WalletListItem[];
  handleOpenWalletList: () => void;
  handleCloseWalletList: () => void;
  handleSelectWallet: (id: WalletId) => Promise<void>;
  handleDisconnectWallet: () => Promise<void>;
};

const WalletContext = createContext<ContextValue | undefined>(undefined);

const LAST_WALLET_KEY = "dfinityWallet";

const readLastWallet = (): WalletId | null => {
  const raw = localStorage.getItem(LAST_WALLET_KEY);
  if (raw === "dfinity" || raw === "plug" || raw === "oisy") return raw;
  return null;
};

const writeLastWallet = (id: WalletId | null) => {
  if (id) {
    localStorage.setItem(LAST_WALLET_KEY, id);
  } else {
    localStorage.removeItem(LAST_WALLET_KEY);
  }
};

const principalToAccountId = (
  principal: Principal | undefined,
  subAccount?: SubAccount
) => {
  if (!principal) return undefined;
  try {
    return AccountIdentifier.fromPrincipal({ principal, subAccount }).toHex();
  } catch {
    return undefined;
  }
};

const subAccountToHex = (subAccount?: SubAccount) => {
  if (!subAccount) return undefined;
  return Array.from(subAccount.toUint8Array())
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

type PlugSession = { principal: Principal; agent: Agent } | null;

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const { user, isConnecting, connect, disconnect } = useAuth();
  const identitykitAgent = useAgent({ host: IC_HOST });
  const isInitializing = useIsInitializing();

  const [listOpen, setListOpen] = useState(false);
  const [pending, setPending] = useState<WalletId | null>(null);
  const [plugSession, setPlugSession] = useState<PlugSession>(null);
  const [isRestoringPlug, setIsRestoringPlug] = useState(
    () => readLastWallet() === "plug"
  );

  const didAttemptPlugResume = useRef(false);

  const identityKitWalletId: WalletId | null = useMemo(() => {
    if (!user) return null;
    const last = readLastWallet();
    if (last === "oisy" || last === "dfinity") return last;
    return "dfinity";
  }, [user]);

  const activeWallet: WalletId | undefined =
    plugSession ? "plug" : identityKitWalletId ?? undefined;

  const authedAgent: Agent | undefined = plugSession
    ? plugSession.agent
    : identitykitAgent;

  useEffect(() => {
    setAuthedAgent(authedAgent);
    return () => {
      if (!plugSession && !identitykitAgent) {
        setAuthedAgent(undefined);
      }
    };
  }, [authedAgent, plugSession, identitykitAgent]);

  useEffect(() => {
    if (didAttemptPlugResume.current) return;
    if (isInitializing) return;
    didAttemptPlugResume.current = true;
    if (readLastWallet() !== "plug") {
      setIsRestoringPlug(false);
      return;
    }
    setIsRestoringPlug(true);
    silentReconnectPlug({
      whitelist: whitelistedCanisterIds,
      host: IC_HOST,
    }).then((session) => {
      if (session) setPlugSession(session);
      else writeLastWallet(null);
    }).finally(() => setIsRestoringPlug(false));
  }, [isInitializing]);

  useEffect(() => {
    if (user && !plugSession && !readLastWallet()) {
      writeLastWallet("dfinity");
    }
  }, [user, plugSession]);

  const principal = plugSession?.principal ?? user?.principal;
  const subAccount = plugSession ? undefined : user?.subAccount;
  const principalId = principal ? principal.toText() : undefined;
  const accountId = useMemo(
    () => principalToAccountId(principal, subAccount),
    [principal, subAccount]
  );
  const subAccountHex = useMemo(() => subAccountToHex(subAccount), [subAccount]);

  const isConnected = !!principal && !!authedAgent;
  const isRestoring = isInitializing || isRestoringPlug;

  let state: WalletStateValue;
  if (isConnected) state = WalletState.Connected;
  else if (pending || isConnecting) state = WalletState.Connecting;
  else if (listOpen) state = WalletState.OpenWalletList;
  else state = WalletState.Idle;

  const handleOpenWalletList = useCallback(() => {
    setListOpen(true);
  }, []);

  const handleCloseWalletList = useCallback(() => {
    setListOpen(false);
    setPending(null);
  }, []);

  const handleSelectWallet = useCallback(
    async (id: WalletId) => {
      setPending(id);
      try {
        if (id === "plug") {
          const session = await connectPlug({
            whitelist: whitelistedCanisterIds,
            host: IC_HOST,
          });
          setPlugSession(session);
          writeLastWallet("plug");
        } else {
          const signerId =
            id === "dfinity" ? "InternetIdentity" : "OISY";
          await connect(signerId);
          writeLastWallet(id);
        }
        setListOpen(false);
      } catch (err) {
        console.error("Wallet connect failed:", err);
      } finally {
        setPending(null);
      }
    },
    [connect]
  );

  const handleDisconnectWallet = useCallback(async () => {
    try {
      if (plugSession) {
        await disconnectPlug();
        setPlugSession(null);
      }
      if (user) {
        await disconnect();
      }
    } finally {
      writeLastWallet(null);
      setAuthedAgent(undefined);
    }
  }, [disconnect, plugSession, user]);

  const value: ContextValue = {
    state,
    walletState: WalletState,
    isConnected,
    isConnecting: state === WalletState.Connecting,
    isRestoring,
    principalId,
    accountId,
    subAccount,
    subAccountHex,
    walletSelected: activeWallet,
    walletList: WALLET_LIST,
    handleOpenWalletList,
    handleCloseWalletList,
    handleSelectWallet,
    handleDisconnectWallet,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};

export const useWalletContext = (): ContextValue => {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWalletContext must be used inside <WalletProvider>");
  }
  return ctx;
};
