import { Outlet, useNavigation } from "react-router-dom";

import Navbar from "@components/navbar/Navbar";
import Footer from "@components/footer/Footer";
import Warning from "@components/warning/Warning";
import useScrollToTopOnNavigation from "@hooks/useScrollToTopOnNavigation";

const SHOW_LEDGER_SWITCH_WARNING = true;

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
  useScrollToTopOnNavigation();

  return (
    <div
      className="flex flex-col min-h-screen bg-background"
      style={
        SHOW_LEDGER_SWITCH_WARNING
          ? {
              background:
                "linear-gradient(to bottom, #222526 0, #222526 58px, rgb(var(--color-background)) 58px)",
            }
          : undefined
      }
    >
      {SHOW_LEDGER_SWITCH_WARNING && <Warning />}
      <Navbar roundedTop={SHOW_LEDGER_SWITCH_WARNING} />
      <div className="flex-grow w-full bg-background rounded-b-2xl relative z-10">
        <div className="max-w-[1440px] mx-auto">
          {navigation.state !== "idle" ? <NavigationProgress /> : <Outlet />}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Layout;
