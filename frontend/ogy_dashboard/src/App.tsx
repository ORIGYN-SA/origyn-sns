import "./App.css";
import {
  createBrowserRouter,
  redirect,
  RouterProvider as ReactRouterProvider,
} from "react-router-dom";

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
// NOTE: NFT viewer (Explorer page) intentionally not routed yet — kept in the
// codebase but disabled. Re-enable by importing `Explorer` from
// "@pages/explorer/Explorer" and pointing the "explorer" route at it.
import { TransactionHistory } from "@pages/transaction-history/TransactionHistory";
import { TransactionsDetails } from "@pages/transactions-details/TransactionsDetails";
import TransactionsAccountsDetails from "@pages/transactions-accounts-details";
import TransactionsAccountHistory from "@pages/transactions-accounts-history";
import { Account } from "@pages/account/index";
import Recovery from "@pages/recovery/Recovery";
import Support from "@pages/support";
import Calculator from "@pages/calculator/Calculator";
import TopTransfersAndBurnsFull from "@pages/dashboard/top-transfers-and-burns/TopTransfersAndBurnsFull";

const redirectWithSearch = (request: Request, pathname: string) => {
  const url = new URL(request.url);
  return redirect(`${pathname}${url.search}`);
};

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
          <TopTransfersAndBurnsFull
            type="transfers"
            title="All Top 25 Transfers"
            limit={25}
          />
        ),
      },
      {
        path: "burns",
        element: (
          <TopTransfersAndBurnsFull
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
            element: <Governance />,
          },
          {
            path: "neurons",
            element: <Neurons />,
          },
          {
            path: "neurons/details",
            element: <NeuronsDetails />,
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
        element: <TokenDistribution />,
      },
      {
        path: "explorer",
        children: [
          {
            index: true,
            loader: ({ request }) =>
              redirectWithSearch(request, "/transaction-history"),
          },
          {
            path: "transactions/:index",
            loader: ({ params, request }) =>
              redirectWithSearch(
                request,
                `/transaction-history/transactions/${params.index}`
              ),
          },
          {
            path: "transactions/accounts/:accountId",
            loader: ({ params, request }) =>
              redirectWithSearch(
                request,
                `/transaction-history/transactions/accounts/${params.accountId}`
              ),
          },
          {
            path: "transactions/accounts/:accountId/history",
            loader: ({ params, request }) =>
              redirectWithSearch(
                request,
                `/transaction-history/transactions/accounts/${params.accountId}/history`
              ),
          },
        ],
      },
      {
        path: "transaction-history",
        children: [
          {
            index: true,
            element: <TransactionHistory />,
          },
          {
            path: "transactions",
            children: [
              {
                path: "/transaction-history/transactions/:index",
                element: <TransactionsDetails />,
              },
              {
                path: "/transaction-history/transactions/accounts/:accountId",
                element: <TransactionsAccountsDetails />,
              },
              {
                path: "/transaction-history/transactions/accounts/:accountId/history",
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
        path: "calculator",
        element: <Calculator />,
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
