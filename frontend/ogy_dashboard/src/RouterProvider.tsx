import {
  createBrowserRouter,
  RouterProvider as ReactRouterProvider,
} from "react-router-dom";

import Layout from "@components/Layout";
import NotFound from "@components/NotFound";
import Dashboard from "@pages/dashboard/Dashboard";

const { GovernanceLoader, Governance } = await import(
  "@pages/governance/Governance"
);
const { NeuronsDetailsLoader, NeuronsDetails } = await import(
  "@pages/governance/components/neurons/details/Details"
);

const { ProposalsLoader, Proposals } = await import(
  "@pages/proposals/Proposals"
);
const { Loader: ProposalsDetailsLoader, Details: ProposalsDetails } =
  await import("@pages/proposals/details/Details");

const { Loader: ExplorerLoader, Explorer } = await import(
  "@pages/explorer/Explorer"
);
const { Loader: ExplorerTxDetailsLoader, Details: ExplorerTxDetails } =
  await import("@pages/explorer/transaction-details/Details");

const {
  Loader: ExplorerAccountDetailsLoader,
  Details: ExplorerAccountDetails,
} = await import("@pages/explorer/account-details/Details");

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
            path: "transaction-details",
            loader: ProposalsDetailsLoader,
            element: <ExplorerTxDetails />,
          },
          {
            path: "account-details",
            loader: ExplorerAccountDetailsLoader,
            element: <ExplorerAccountDetails />,
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
