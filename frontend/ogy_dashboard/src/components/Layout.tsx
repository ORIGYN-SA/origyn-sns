import { Outlet, useNavigation } from "react-router-dom";

import Navbar from "@components/navbar/Navbar";
import Footer from "@components/footer/Footer";

const Layout = () => {
  const navigation = useNavigation();

  return (
    <div>
      <div style={{ position: "fixed", top: 0, right: 0 }}>
        {navigation.state !== "idle" && <p>Navigation in progress...</p>}
      </div>
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  );
};

export default Layout;
