import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { IdentityKitProvider } from "@nfid/identitykit/react";
import { IdentityKitAuthType, InternetIdentity } from "@nfid/identitykit";
import "@nfid/identitykit/react/styles.css";

import App from "./App.tsx";
import { TooltipProvider } from "@components/ui/tooltip/TooltipPrimitive";
import { WalletProvider } from "@components/auth/WalletProvider";
import {
  clearLegacyIdentityKitOisySession,
  DERIVATION_ORIGIN,
} from "@components/auth/constants";
import { whitelistedCanisterIds } from "@services/actor";

if (import.meta.env.DEV) {
  const script = document.createElement("script");
  script.src = "//unpkg.com/react-scan/dist/auto.global.js";
  script.crossOrigin = "anonymous";
  document.head.appendChild(script);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);
const isLocalhostDev =
  import.meta.env.DEV && LOCAL_HOSTNAMES.has(window.location.hostname);
const signerClientOptions = isLocalhostDev
  ? { targets: whitelistedCanisterIds }
  : { targets: whitelistedCanisterIds, derivationOrigin: DERIVATION_ORIGIN };

clearLegacyIdentityKitOisySession();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <IdentityKitProvider
    authType={IdentityKitAuthType.DELEGATION}
    signers={[InternetIdentity]}
    signerClientOptions={signerClientOptions}
  >
    <WalletProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={200}>
          <App />
        </TooltipProvider>
      </QueryClientProvider>
    </WalletProvider>
  </IdentityKitProvider>
);
