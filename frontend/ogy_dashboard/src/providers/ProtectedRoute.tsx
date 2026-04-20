import { Navigate, Outlet } from "react-router-dom";
import { useWallet } from "@components/auth/useWallet";

const ProtectedRoute = () => {
  const { isConnected, state, walletState } = useWallet();

  if (state === walletState.Connecting) {
    return null;
  }

  if (!isConnected) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
