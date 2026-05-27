import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { IdentityKitProvider } from "@amerej/identitykit/react";
import { InternetIdentity, OISY } from "@amerej/identitykit";
import "@amerej/identitykit/react/styles.css";

import App from "./App.tsx";
import { TooltipProvider } from "@components/ui/tooltip/TooltipPrimitive";
import { WalletProvider } from "@components/auth/WalletProvider";
import { DERIVATION_ORIGIN } from "@components/auth/constants";
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

// No global authType: IdentityKit uses DELEGATION for Internet Identity and
// ACCOUNTS for OISY. Forcing DELEGATION breaks OISY, which has no delegation.
//
// derivationOrigin keeps II principals stable on the prod-like origins listed
// in the production canister's ii-alternative-origins. The amerej fork skips
// it for OISY (whose principal is origin-independent), so no cross-origin issue.
const usesDerivationOrigin = ["preprod", "production"].includes(
  import.meta.env.MODE
);

const signerClientOptions = {
  targets: whitelistedCanisterIds,
  maxTimeToLive: 604_800_000_000_000n, // 7 days, matching the other platform
  idleOptions: { disableIdle: false },
  ...(usesDerivationOrigin ? { derivationOrigin: DERIVATION_ORIGIN } : {}),
};

// @amerej/identitykit ships InternetIdentity with an empty providerUrl, which
// makes auth-client fall back to a deprecated II frontend. Pin it to id.ai.
const InternetIdentitySigner = {
  ...InternetIdentity,
  providerUrl: "https://id.ai/?feature_flag_guided_upgrade=true",
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <IdentityKitProvider
    signers={[InternetIdentitySigner, OISY]}
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
