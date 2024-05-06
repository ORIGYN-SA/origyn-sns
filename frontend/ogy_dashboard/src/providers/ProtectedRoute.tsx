import { Navigate, Outlet } from "react-router-dom";
import { useConnect } from "@connect2ic/react";

const ProtectedRoute = () => {
  const { isConnected, isInitializing } = useConnect();

  if (!isInitializing && !isConnected) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
