import { Outlet, useNavigation } from "react-router-dom";

import Navbar from "@components/navbar/Navbar";
import Footer from "@components/footer/Footer";

const Layout = () => {
  const navigation = useNavigation();

  return (
    <div className="flex flex-col h-screen">
      <div style={{ position: "fixed", top: 200, right: 0 }}>
        {navigation.state !== "idle" && <p>Navigation in progress...</p>}
      </div>
      <Navbar />
      <div className="flex-grow">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
};

export default Layout;
