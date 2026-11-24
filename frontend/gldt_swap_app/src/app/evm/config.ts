import { createConfig, fallback, unstable_connector } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";
import { base, mainnet } from "viem/chains";

import { REOWN_PROJECT_ID } from "@constants";

/** WalletConnect needs a Reown project ID; without one the option says so instead of connecting. */
export const WALLETCONNECT_READY = REOWN_PROJECT_ID.length > 0;

const connectors = [
  injected({ shimDisconnect: true }),
  ...(WALLETCONNECT_READY
    ? [
        walletConnect({
          projectId: REOWN_PROJECT_ID,
          showQrModal: true,
          metadata: {
            name: "GLDT",
            description: "Gold Token on the Internet Computer, Ethereum and Base",
            url: "https://gldt.org",
            icons: ["https://gldt.org/gldt_logo.svg"],
          },
        }),
      ]
    : []),
];

// Reads go through the connected wallet's own provider: balances and history come from
// api.gldt.org, so the app only reads a chain while the user signs something there.
const viaWallet = () =>
  fallback([
    unstable_connector(injected),
    ...(WALLETCONNECT_READY ? [unstable_connector(walletConnect)] : []),
  ]);

export const wagmiConfig = createConfig({
  chains: [mainnet, base],
  connectors,
  transports: {
    [mainnet.id]: viaWallet(),
    [base.id]: viaWallet(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
