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

const router = createBrowserRouter([
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
