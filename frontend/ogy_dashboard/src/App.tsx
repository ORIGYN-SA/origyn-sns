import "./App.css";
import { lazy, Suspense } from "react";
import {
  createBrowserRouter,
  redirect,
  RouterProvider as ReactRouterProvider,
} from "react-router-dom";
import { LoaderSpin } from "@components/ui";

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
import { TransactionHistory } from "@pages/transaction-history/TransactionHistory";
import { TransactionsDetails } from "@pages/transactions-details/TransactionsDetails";
import TransactionsAccountsDetails from "@pages/transactions-accounts-details";
import TransactionsAccountHistory from "@pages/transactions-accounts-history";
import { Account } from "@pages/account/index";
import Recovery from "@pages/recovery/Recovery";
import Support from "@pages/support";
import Calculator from "@pages/calculator/Calculator";
import TopTransfersAndBurnsFull from "@pages/dashboard/top-transfers-and-burns/TopTransfersAndBurnsFull";
import LocaleGate, { LocaleRedirect } from "@i18n/LocaleGate";
import { splitLocalePath } from "@i18n/paths";

// Explorer subpages are code-split: they pull in the certificate viewer and
// grid components, which the initial bundle does not need.
const CertificatesPage = lazy(() =>
  import("@pages/explorer/CertificatesPage").then((m) => ({
    default: m.CertificatesPage,
  }))
);
const CertificatePage = lazy(() =>
  import("@pages/explorer/CertificatePage").then((m) => ({
    default: m.CertificatePage,
  }))
);
const CollectionsPage = lazy(() =>
  import("@pages/explorer/CollectionsPage").then((m) => ({
    default: m.CollectionsPage,
  }))
);
const CollectionDetailPage = lazy(() =>
  import("@pages/explorer/CollectionDetailPage").then((m) => ({
    default: m.CollectionDetailPage,
  }))
);
const NftTransactionPage = lazy(() =>
  import("@pages/explorer/NftTransactionPage").then((m) => ({
    default: m.NftTransactionPage,
  }))
);
const CollectorPage = lazy(() =>
  import("@pages/explorer/CollectorPage").then((m) => ({
    default: m.CollectorPage,
  }))
);

const LazyPage = ({ children }: { children: React.ReactNode }) => (
  <Suspense
    fallback={
      <div className="flex items-center justify-center py-32">
        <LoaderSpin size="md" />
      </div>
    }
  >
    {children}
  </Suspense>
);

// Redirect to an in-app path while preserving the active locale prefix and the
// inbound query string. Loaders run outside React context, so the locale is
// read from the request URL rather than from useLocale().
const redirectWithSearch = (request: Request, pathname: string) => {
  const url = new URL(request.url);
  const { locale } = splitLocalePath(url.pathname);
  const prefix = locale ? `/${locale}` : "";
  return redirect(`${prefix}${pathname}${url.search}`);
};

const router = createBrowserRouter([
  {
    // All in-app pages live under /:locale. LocaleGate validates the segment,
    // syncs <html lang/dir>, and provides the active locale to descendants.
    path: "/:locale",
    element: <LocaleGate />,
    children: [
      {
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
            path: "viewer",
            children: [
              {
                index: true,
                element: <Explorer />,
              },
              {
                path: "certificates",
                element: (
                  <LazyPage>
                    <CertificatesPage />
                  </LazyPage>
                ),
              },
              {
                path: "certificate/:canisterId/:tokenId",
                element: (
                  <LazyPage>
                    <CertificatePage />
                  </LazyPage>
                ),
              },
              {
                path: "collections",
                element: (
                  <LazyPage>
                    <CollectionsPage />
                  </LazyPage>
                ),
              },
              {
                path: "collections/:canisterId",
                element: (
                  <LazyPage>
                    <CollectionDetailPage />
                  </LazyPage>
                ),
              },
              {
                path: "transaction/:canisterId/:tokenId/:blockId",
                element: (
                  <LazyPage>
                    <NftTransactionPage />
                  </LazyPage>
                ),
              },
              {
                path: "collectors/:principal",
                element: (
                  <LazyPage>
                    <CollectorPage />
                  </LazyPage>
                ),
              },
            ],
          },
          {
            // Legacy /explorer/* deep links: transactions still resolve to
            // the transaction history page, everything else to /viewer.
            path: "explorer",
            children: [
              {
                index: true,
                loader: ({ request }) => redirectWithSearch(request, "/viewer"),
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
              {
                path: "*",
                loader: ({ params, request }) =>
                  redirectWithSearch(request, `/viewer/${params["*"]}`),
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
                    path: ":index",
                    element: <TransactionsDetails />,
                  },
                  {
                    path: "accounts/:accountId",
                    element: <TransactionsAccountsDetails />,
                  },
                  {
                    path: "accounts/:accountId/history",
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
    ],
  },
  {
    // Anything not already locale-prefixed (including "/", "/governance", etc.)
    // is negotiated client-side and redirected to /:locale/<path>.
    path: "*",
    element: <LocaleRedirect />,
  },
]);

const App = () => {
  return (
    <ReactRouterProvider router={router} fallbackElement={<p>Loading...</p>} />
  );
};

export default App;
