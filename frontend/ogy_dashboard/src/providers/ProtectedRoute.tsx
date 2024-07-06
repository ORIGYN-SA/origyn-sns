import { Navigate, Outlet } from "react-router-dom";
// import { useWallet } from "artemis-react";
// import { Dialog, LoaderSpin } from "@components/ui";

const ProtectedRoute = () => {
  // const { isConnected, state, walletState } = useWallet();
  const walletId = localStorage.getItem("dfinityWallet") || "";

  if (!walletId) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
