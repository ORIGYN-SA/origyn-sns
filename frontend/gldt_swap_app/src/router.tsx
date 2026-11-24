import { lazy, Suspense } from "react";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider as ReactRouterProvider,
} from "react-router-dom";

import Layout from "@components/shared/Layout";
import NotFound from "@components/shared/routes/NotFound";

import Home from "features/home";

import {
  Explorer,
  AccountOverview,
  AccountTransactionDetails,
} from "features/index";

// The GLDT app loads on its own, so the landing page and the explorer stay light.
const AppLayout = lazy(() => import("./app/shell/AppLayout"));
const WalletPage = lazy(() => import("./app/wallet/WalletPage"));
const BridgePage = lazy(() => import("./app/bridge/BridgePage"));

const router = createBrowserRouter([
  {
    element: (
      <Suspense fallback={null}>
        <AppLayout />
      </Suspense>
    ),
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
            element: <Explorer />,
          },
          {
            path: "transactions/account",
            element: <AccountOverview />,
          },
          {
            path: "top_holders/account",
            element: <AccountOverview />,
          },
          {
            path: "transaction/:index",
            element: <AccountTransactionDetails />,
          },
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
