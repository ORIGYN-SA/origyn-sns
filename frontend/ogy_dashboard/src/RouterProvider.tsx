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
        async lazy() {
          const { GovernanceLoader, Governance } = await import(
            "@pages/governance/Governance"
          );
          return { loader: GovernanceLoader, Component: Governance };
        },
      },
      //   {
      //     path: "dashboard",
      //     async lazy() {
      //       // Multiple routes in lazy file
      //       let { DashboardLayout } = await import("./pages/Dashboard");
      //       return { Component: DashboardLayout };
      //     },
      //     children: [
      //       {
      //         index: true,
      //         async lazy() {
      //           let { DashboardIndex } = await import("./pages/Dashboard");
      //           return { Component: DashboardIndex };
      //         },
      //       },
      //       {
      //         path: "messages",
      //         async lazy() {
      //           let { dashboardMessagesLoader, DashboardMessages } = await import(
      //             "./pages/Dashboard"
      //           );
      //           return {
      //             loader: dashboardMessagesLoader,
      //             Component: DashboardMessages,
      //           };
      //         },
      //       },
      //     ],
      //   },
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
