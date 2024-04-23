import "./App.css";
import {
  createBrowserRouter,
  RouterProvider as ReactRouterProvider,
} from "react-router-dom";
import { QueryClient } from "@tanstack/react-query";

import Layout from "@components/Layout";
import NotFound from "@components/NotFound";
import Dashboard from "@pages/dashboard/Dashboard";
import ProtectedRoute from "@providers/ProtectedRoute";

const { Governance } = await import("@pages/governance/Governance");
const { NeuronsDetails } = await import(
  "@pages/neurons-details/NeuronsDetails"
);

const { Proposals } = await import("@pages/proposals/Proposals");
const { ProposalsDetails } = await import(
  "@pages/proposals-details/ProposalsDetails"
);

const { Explorer } = await import("@pages/explorer/Explorer");
const { TransactionsDetails } = await import(
  "@pages/transactions-details/TransactionsDetails"
);

const { Account } = await import("@pages/account");

const { TransactionsAccountsDetails } = await import(
  "@pages/transactions-accounts-details/TransactionsAccountsDetails"
);

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
            path: "neurons/details",
            loader: NeuronsDetails.loader,
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
            loader: Proposals.loader,
            element: <Proposals />,
          },
          {
            path: "details",
            loader: ProposalsDetails.loader,
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
