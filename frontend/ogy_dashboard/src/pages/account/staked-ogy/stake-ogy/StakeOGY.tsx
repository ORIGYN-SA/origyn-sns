import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { useWallet } from "@components/auth/useWallet";

import { NNS_PLATFORM_URL } from "@constants/index";
import { Button, Dialog } from "@components/ui";
import { useT } from "@i18n/LocaleContext";

const StakeOGY = () => {
  const t = useT();
  const { walletSelected } = useWallet();
  const [show, setShow] = useState(false);

  const handleShow = () => setShow(true);
  const handleClose = () => setShow(false);

  return (
    <>
      <Button
        className="h-12 w-full !px-[25px] !py-0 text-[14px] leading-[48px] transition-colors hover:bg-charcoal2"
        onClick={handleShow}
      >
        {t("account.staked.stake")}
      </Button>
      <Dialog
        show={show}
        handleClose={handleClose}
        panelClassName="max-w-[420px] rounded-[20px] bg-surface-1 border border-border-strong shadow-2xl"
        floatingClose
      >
        <div className="pt-10 pb-6 px-5 mx-auto w-full max-w-[420px] flex flex-col gap-7">
          <div className="flex flex-col items-center gap-1.5 text-center">
            <div className="text-[22px] font-semibold leading-none text-content">
              {t("account.staked.stakeOgy")}
            </div>
            <div className="text-[13px] leading-snug text-muted max-w-[340px]">
              {t("account.staked.stakeDescription")}
            </div>
          </div>
          {walletSelected && walletSelected !== "dfinity" && (
            <div className="rounded-2xl border border-amber-300/60 bg-amber-100/60 dark:border-amber-400/30 dark:bg-amber-500/10 p-4 text-center text-[13px] leading-snug text-content">
              {t("account.staked.warningNotConnected")}{" "}
              <span className="font-semibold">
                {t("account.staked.internetIdentity")}
              </span>
              .
              <br /> {t("account.staked.warningNeedIdentity")}{" "}
              <span className="font-semibold">
                {t("account.staked.internetIdentity")}
              </span>{" "}
              {t("account.staked.warningToConnect")}
            </div>
          )}
          <Link
            to={NNS_PLATFORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClose}
          >
            <Button className="w-full !py-0 text-[14px] leading-[44px] flex items-center justify-center gap-2">
              <span>{t("account.staked.goToNns")}</span>
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </Dialog>
    </>
  );
};

export default StakeOGY;
