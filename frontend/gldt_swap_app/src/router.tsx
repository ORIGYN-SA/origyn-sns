import { lazy, Suspense } from "react";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider as ReactRouterProvider,
} from "react-router-dom";

import Layout from "@components/shared/Layout";
import NotFound from "@components/shared/routes/NotFound";
import RouteError from "@components/shared/routes/RouteError";

import Home from "features/home";
import { ExplorerAccountRedirect, ExplorerBlockRedirect } from "./app/explorer/redirects";

// The GLDT app and the explorer load on their own, so the landing page stays light.
const AppLayout = lazy(() => import("./app/shell/AppLayout"));
const WalletPage = lazy(() => import("./app/wallet/WalletPage"));
const BridgePage = lazy(() => import("./app/bridge/BridgePage"));
const ExplorerPage = lazy(() => import("./app/explorer/ExplorerPage"));

const router = createBrowserRouter([
  {
    element: (
      <Suspense fallback={null}>
        <AppLayout />
      </Suspense>
    ),
    errorElement: <RouteError />,
    children: [
      {
        path: "wallet",
        element: (
          <Suspense fallback={null}>
            <WalletPage />
          </Suspense>
        ),
      },
      {
        path: "bridge",
        element: (
          <Suspense fallback={null}>
            <BridgePage />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: "/",
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "explorer",
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={null}>
                <ExplorerPage />
              </Suspense>
            ),
          },
          // The old explorer's links: an account's page and a ledger block's page.
          { path: "transactions/account", element: <ExplorerAccountRedirect /> },
          { path: "top_holders/account", element: <ExplorerAccountRedirect /> },
          { path: "transaction/:index", element: <ExplorerBlockRedirect /> },
        ],
      },
      {
        path: "swap/*",
        element: <Navigate to="/wallet" replace />,
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
