import {
  createBrowserRouter,
  RouterProvider as ReactRouterProvider,
} from "react-router-dom";

import Layout from "@components/Layout";
import NotFound from "@components/NotFound";
import Dashboard from "@pages/dashboard/Dashboard";

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
            async lazy() {
              const { GovernanceLoader, Governance } = await import(
                "@pages/governance/Governance"
              );
              return { loader: GovernanceLoader, Component: Governance };
            },
          },
          {
            path: "neurons",
            async lazy() {
              const { NeuronsDetailsLoader, NeuronsDetails } = await import(
                "@pages/governance/components/neurons/details/Details"
              );
              return {
                loader: NeuronsDetailsLoader,
                Component: NeuronsDetails,
              };
            },
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
