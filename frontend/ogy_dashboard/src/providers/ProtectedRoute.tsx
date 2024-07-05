import { Navigate, Outlet } from "react-router-dom";
import { useWallet } from "artemis-react";

const ProtectedRoute = () => {
  const { isConnected } = useWallet();

  if (!isConnected) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
