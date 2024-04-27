// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { useCallback } from "react";
import type { Location, useMatches } from "react-router-dom";
import { ScrollRestoration, Outlet, useNavigation } from "react-router-dom";

import Navbar from "@components/navbar/Navbar";
import Footer from "@components/footer/Footer";

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
      <div style={{ position: "fixed", top: 200, right: 0 }}>
        {navigation.state !== "idle" && <p>Navigation in progress...</p>}
      </div>
      <Navbar />
      <div className="flex-grow">
        <Outlet />
      </div>
      <ScrollRestoration getKey={getKey} />
      <Footer />
    </div>
  );
};

export default Layout;
