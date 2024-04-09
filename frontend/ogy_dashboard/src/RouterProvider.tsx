import {
  createBrowserRouter,
  RouterProvider as ReactRouterProvider,
} from "react-router-dom";
import { QueryClient } from "@tanstack/react-query";

import Layout from "@components/Layout";
import NotFound from "@components/NotFound";
import Dashboard from "@pages/dashboard/Dashboard";

const { GovernanceLoader, Governance } = await import(
  "@pages/governance/Governance"
);
const { NeuronsDetailsLoader, NeuronsDetails } = await import(
  "@pages/neurons-details/NeuronsDetails"
);

const { ProposalsLoader, Proposals } = await import(
  "@pages/proposals/Proposals"
);
const { Loader: ProposalsDetailsLoader, ProposalsDetails } = await import(
  "@pages/proposals-details/ProposalsDetails"
);

const { Loader: ExplorerLoader, Explorer } = await import(
  "@pages/explorer/Explorer"
);
const { loader: TransactionsDetailsLoader, TransactionsDetails } = await import(
  "@pages/transactions-details/TransactionsDetails"
);

const queryClient = new QueryClient();

const {
  loader: TransactionsAccountsDetailsLoader,
  TransactionsAccountsDetails,
} = await import(
  "@pages/transactions-accounts-details/TransactionsAccountsDetails"
);

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
            loader: GovernanceLoader,
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
            loader: NeuronsDetailsLoader,
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
            loader: ProposalsLoader,
            element: <Proposals />,
          },
          {
            path: "details",
            loader: ProposalsDetailsLoader,
            element: <ProposalsDetails />,
          },
        ],
      },
      {
        path: "explorer",
        children: [
          {
            index: true,
            loader: ExplorerLoader,
            element: <Explorer />,
          },
          {
            path: "transactions",
            children: [
              {
                path: "/explorer/transactions/:index",
                loader: TransactionsDetailsLoader(queryClient),
                element: <TransactionsDetails />,
              },
              {
                path: "/explorer/transactions/accounts/:id",
                loader: TransactionsAccountsDetailsLoader(queryClient),
                element: <TransactionsAccountsDetails />,
              },
            ],
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

const RouterProvider = () => {
  return (
    <ReactRouterProvider router={router} fallbackElement={<p>Loading...</p>} />
  );
};

export default RouterProvider;
