import { ReactNode, useEffect } from "react";
import { NFIDW, InternetIdentity, OISY } from "@amerej/identitykit";
import {
  IdentityKitProvider,
  useAuth,
  useIsInitializing,
  useAgent,
} from "@amerej/identitykit/react";
import { useAtom, useSetAtom } from "jotai";
import { useQueryClient } from "@tanstack/react-query";
import { HttpAgent } from "@dfinity/agent";

import { stateAtom } from "../atoms";
import { Canisters } from "../interfaces";
import { LoaderSpin } from "@components/ui";

const HOST = "https://icp-api.io";

// The fork ships InternetIdentity with an empty providerUrl, which makes @dfinity/auth-client fall
// back to the old identity.internetcomputer.org. id.ai with the guided upgrade lets existing II
// users move over, as on app.gold-dao.org.
const InternetIdentityIdAi = {
  ...InternetIdentity,
  providerUrl: "https://id.ai/?feature_flag_guided_upgrade=true",
};

const AuthProviderInit = ({
  canisters,
  children,
}: {
  canisters: Canisters;
  children: ReactNode;
}) => {
  const { user } = useAuth();
  const isInitializing = useIsInitializing();
  const authenticatedAgent = useAgent({ host: HOST });
  const [state, setState] = useAtom(stateAtom);

  useEffect(() => {
    let live = true;
    HttpAgent.create({ host: HOST }).then((unauthenticatedAgent) => {
      if (live) setState((s) => ({ ...s, unauthenticatedAgent, canisters }));
    });
    return () => {
      live = false;
    };
    // The canister map is fixed for the life of the app.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setState((s) =>
      user && authenticatedAgent
        ? {
            ...s,
            principalId: user.principal.toText(),
            isConnected: true,
            isConnecting: false,
            authenticatedAgent,
          }
        : {
            ...s,
            principalId: "",
            isConnected: false,
            isConnecting: isInitializing,
            authenticatedAgent: undefined,
          }
    );
  }, [user, authenticatedAgent, isInitializing, setState]);

  if (!state.unauthenticatedAgent) {
    return (
      <div className="flex h-screen">
        <div className="m-auto">
          <LoaderSpin />
        </div>
      </div>
    );
  }
  return children;
};

export const AuthProvider = ({
  children,
  targets = [],
  canisters = {},
}: {
  children: ReactNode;
  targets?: string[];
  canisters: Canisters;
}) => {
  const setState = useSetAtom(stateAtom);
  const queryClient = useQueryClient();

  return (
    <IdentityKitProvider
      signers={[NFIDW, InternetIdentityIdAi, OISY]}
      signerClientOptions={{
        targets,
        maxTimeToLive: 604800000000000n, // one week
        idleOptions: { disableIdle: false },
      }}
      onConnectFailure={(err: Error) => {
        console.error("Login failed", err);
      }}
      onConnectSuccess={() => {
        queryClient.clear();
      }}
      onDisconnect={() => {
        queryClient.clear();
        setState((s) => ({
          ...s,
          principalId: "",
          isConnected: false,
          isConnecting: false,
          authenticatedAgent: undefined,
        }));
      }}
    >
      <AuthProviderInit canisters={canisters}>{children}</AuthProviderInit>
    </IdentityKitProvider>
  );
};
