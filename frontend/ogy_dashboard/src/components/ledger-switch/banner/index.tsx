import { PropsWithChildren } from "react";
import clsx from "clsx";
import LedgerSwitchBannerContent from "@components/ledger-switch/banner-content";

interface LedgerSwitchBannerProps extends PropsWithChildren {
  className?: string;
}

const LedgerSwitchBanner = ({
  children,
  className,
}: LedgerSwitchBannerProps) => {
  return (
    <div
      className={clsx(
        "bg-ledger-switch bg-cover bg-center bg-black text-content p-12 rounded-[40px] shadow-[0px_10px_50px_0px_#06274926]",
        className
      )}
    >
      <LedgerSwitchBannerContent>{children}</LedgerSwitchBannerContent>
    </div>
  );
};

export default LedgerSwitchBanner;
