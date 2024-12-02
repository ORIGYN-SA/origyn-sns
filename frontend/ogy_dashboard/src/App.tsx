/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import "./App.css";
import {
  createBrowserRouter,
  RouterProvider as ReactRouterProvider,
} from "react-router-dom";
import { useWalletInit } from "@amerej/artemis-react";

import {
  // APP_MODE,
  SNS_LEDGER_CANISTER_ID,
  ICP_LEDGER_CANISTER_ID,
  SNS_GOVERNANCE_CANISTER_ID,
  TOKEN_METRICS_CANISTER_ID,
  LEGACY_LEDGER_CANISTER_ID,
  OGY_TOKEN_SWAP_CANISTER_ID,
  SNS_REWARDS_CANISTER_ID,
  TOKEN_STATS_CANISTER_ID,
} from "@constants/index";

import { idlFactory as governanceIdl } from "@services/candid/sns_governance";
import { idlFactory as ledgerIdl } from "@services/candid/sns_ledger";
import { idlFactory as ledgerLegacyIdl } from "@services/candid/ledger.legacy";
import { idlFactory as superStatsIdl } from "@services/candid/super_stats";
import { idlFactory as tokenMetricsIdl } from "@services/candid/token_metrics";
import { idlFactory as OGYTokenSwapIdl } from "@services/candid/ogy_token_swap";
import { idlFactory as SNSRewardsIdl } from "@services/candid/sns_rewards";

import Layout from "@components/Layout";
import Dashboard from "@pages/dashboard";
import NotFound from "@components/NotFound";
import ProtectedRoute from "@providers/ProtectedRoute";
import { Governance } from "@pages/governance";
import { Neurons } from "@pages/neurons/Neurons";
import { NeuronsDetails } from "@pages/neurons-details/NeuronsDetails";
import { Proposals } from "@pages/proposals/Proposals";
import { ProposalsDetails } from "@pages/proposals-details/ProposalsDetails";
import { TokenDistribution } from "@pages/token-distribution";
import { Explorer } from "@pages/explorer/Explorer";
import { TransactionsDetails } from "@pages/transactions-details/TransactionsDetails";
import TransactionsAccountsDetails from "@pages/transactions-accounts-details";
import TransactionsAccountHistory from "@pages/transactions-accounts-history";
import { Account } from "@pages/account/index";
import Recovery from "@pages/recovery/Recovery";
import Support from "@pages/support";
import TopTransfersAndBurns from "@pages/dashboard/top-transfers-and-burns/TopTransfersAndBurns";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "transfers",
        element: (
          <TopTransfersAndBurns
            type="transfers"
            title="All Top 25 Transfers"
            limit={25}
          />
        ),
      },
      {
        path: "burns",
        element: (
          <TopTransfersAndBurns
            type="burns"
            title="All Top 25 Burns"
            limit={25}
          />
        ),
      },
      {
        path: "governance",
        children: [
          {
            index: true,
            loader: Governance.loader,
            element: <Governance />,
            // async lazy() {
            //   const { GovernanceLoader, Governance } = await import(
            //     "@pages/governance/Governance"
            //   );
            //   return { loader: GovernanceLoader, Component: Governance };
            // },
          },
          {
            path: "neurons",
            element: <Neurons />,
            // async lazy() {
            //   const { NeuronsDetailsLoader, NeuronsDetails } = await import(
            //     "@pages/governance/components/neurons/details/Details"
            //   );
            //   return {
            //     loader: NeuronsDetailsLoader,
            //     Component: NeuronsDetails,
            //   };
            // },
          },
          {
            path: "neurons/details",
            element: <NeuronsDetails />,
            // async lazy() {
            //   const { NeuronsDetailsLoader, NeuronsDetails } = await import(
            //     "@pages/governance/components/neurons/details/Details"
            //   );
            //   return {
            //     loader: NeuronsDetailsLoader,
            //     Component: NeuronsDetails,
            //   };
            // },
          },
        ],
      },
      {
        path: "proposals",
        children: [
          {
            index: true,
            element: <Proposals />,
          },
          {
            path: "details",
            element: <ProposalsDetails />,
          },
        ],
      },
      {
        path: "token-distribution",
        children: [
          {
            index: true,
            element: <TokenDistribution />,
          },
        ],
      },
      {
        path: "explorer",
        children: [
          {
            index: true,
            element: <Explorer />,
          },
          {
            path: "transactions",
            children: [
              {
                path: "/explorer/transactions/:index",
                element: <TransactionsDetails />,
              },
              {
                path: "/explorer/transactions/accounts/:accountId",
                element: <TransactionsAccountsDetails />,
              },
              {
                path: "/explorer/transactions/accounts/:accountId/history",
                element: <TransactionsAccountHistory />,
              },
            ],
          },
        ],
      },
      {
        path: "account",
        element: <ProtectedRoute />,
        children: [
          {
            index: true,
            element: <Account />,
          },
        ],
      },
      {
        path: "recovery",
        // element: <ProtectedRoute />,
        children: [
          {
            index: true,
            element: <Recovery />,
          },
        ],
      },
      {
        path: "support",
        children: [
          {
            index: true,
            element: <Support />,
          },
        ],
      },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
]);

const App = () => {
  useWalletInit({
    host: "https://identity.ic0.app",
    derivationOrigin: "https://jbj2y-2qaaa-aaaal-ajc5q-cai.icp0.io",
    whitelist: [
      SNS_GOVERNANCE_CANISTER_ID,
      SNS_LEDGER_CANISTER_ID,
      LEGACY_LEDGER_CANISTER_ID,
      TOKEN_METRICS_CANISTER_ID,
      OGY_TOKEN_SWAP_CANISTER_ID,
      SNS_REWARDS_CANISTER_ID,
      TOKEN_STATS_CANISTER_ID,
      ICP_LEDGER_CANISTER_ID,
    ],
    canisters: {
      governance: {
        canisterId: SNS_GOVERNANCE_CANISTER_ID,
        idlFactory: governanceIdl,
      },
      ledger: {
        canisterId: SNS_LEDGER_CANISTER_ID,
        idlFactory: ledgerIdl,
      },
      ledgerLegacy: {
        canisterId: LEGACY_LEDGER_CANISTER_ID,
        idlFactory: ledgerLegacyIdl,
      },
      ledgerICP: {
        canisterId: ICP_LEDGER_CANISTER_ID,
        idlFactory: ledgerLegacyIdl,
      },
      tokenMetrics: {
        canisterId: TOKEN_METRICS_CANISTER_ID,
        idlFactory: tokenMetricsIdl,
      },
      tokenStats: {
        canisterId: TOKEN_STATS_CANISTER_ID,
        idlFactory: superStatsIdl,
      },
      OGYTokenSwap: {
        canisterId: OGY_TOKEN_SWAP_CANISTER_ID,
        idlFactory: OGYTokenSwapIdl,
      },
      SNSRewards: {
        canisterId: SNS_REWARDS_CANISTER_ID,
        idlFactory: SNSRewardsIdl,
      },
    },
  });
  return (
    <ReactRouterProvider router={router} fallbackElement={<p>Loading...</p>} />
  );
};

export default App;
