/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import "./App.css";
import {
  createBrowserRouter,
  RouterProvider as ReactRouterProvider,
} from "react-router-dom";
import { QueryClient } from "@tanstack/react-query";

import Layout from "@components/Layout";
import Dashboard from "@pages/dashboard/Dashboard";
import NotFound from "@components/NotFound";
import ProtectedRoute from "@providers/ProtectedRoute";
import { Governance } from "@pages/governance/Governance";
import { Neurons } from "@pages/neurons/Neurons";
import { NeuronsDetails } from "@pages/neurons-details/NeuronsDetails";
import { Proposals } from "@pages/proposals/Proposals";
import { ProposalsDetails } from "@pages/proposals-details/ProposalsDetails";
import { Explorer } from "@pages/explorer/Explorer";
import { TransactionsDetails } from "@pages/transactions-details/TransactionsDetails";
import { TransactionsAccountsDetails } from "@pages/transactions-accounts-details/TransactionsAccountsDetails";
import { Account } from "@pages/account/index";

const queryClient = new QueryClient();

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
        path: "explorer",
        children: [
          {
            index: true,
            loader: Explorer.loader,
            element: <Explorer />,
          },
          {
            path: "transactions",
            children: [
              {
                path: "/explorer/transactions/:index",
                loader: TransactionsDetails.loader(queryClient),
                element: <TransactionsDetails />,
              },
              {
                path: "/explorer/transactions/accounts/:id",
                loader: TransactionsAccountsDetails.loader(queryClient),
                element: <TransactionsAccountsDetails />,
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
            loader: Account.loader,
            element: <Account />,
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
  return (
    <ReactRouterProvider router={router} fallbackElement={<p>Loading...</p>} />
  );
};

export default App;
