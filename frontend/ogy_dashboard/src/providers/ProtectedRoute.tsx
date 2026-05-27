import { Outlet } from "react-router-dom";
import { useWallet } from "@components/auth/useWallet";
import Auth from "@components/auth/Auth";

const ProtectedRoute = () => {
  const { isConnected, isRestoring, state, walletState } = useWallet();

  if (isRestoring || state === walletState.Connecting) {
    return null;
  }

  if (!isConnected) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center gap-5 px-6 text-center">
        <div className="flex max-w-sm flex-col gap-2">
          <div className="text-[22px] font-semibold leading-tight text-content">
            Connect your wallet
          </div>
          <div className="text-[14px] leading-6 text-muted">
            You need an active wallet session to view this page.
          </div>
        </div>
        <Auth label="Connect wallet" />
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
