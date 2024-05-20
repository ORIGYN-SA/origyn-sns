// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { useCallback } from "react";
import type { Location, useMatches } from "react-router-dom";
import { ScrollRestoration, Outlet, useNavigation } from "react-router-dom";

import Navbar from "@components/navbar/Navbar";
import Footer from "@components/footer/Footer";

const NavigationProgress = () => {
  return (
    <div className="flex items-center justify-center my-32 xl:my-64">
      <div className="text-center">
        <div className="border-4 xl:border-8 border-accent/20 border-t-accent h-16 w-16 xl:h-32 xl:w-32 animate-spin rounded-full" />
      </div>
    </div>
  );
};

const Layout = () => {
  const navigation = useNavigation();

  const getKey = useCallback(
    (location: Location, matches: ReturnType<typeof useMatches>) => {
      const match = matches.find((m) => m.handle?.scrollMode);
      if (match?.handle?.scrollMode === "pathname") {
        return location.pathname;
      }
      return location.key;
    },
    []
  );

  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <div className="flex-grow">
        {navigation.state !== "idle" ? <NavigationProgress /> : <Outlet />}
      </div>
      <ScrollRestoration getKey={getKey} />
      <Footer />
    </div>
  );
};

export default Layout;
