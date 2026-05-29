import { Link } from "react-router-dom";
import { useWallet } from "@components/auth/useWallet";
import { Button, Dialog } from "@components/ui";
import PrincipalIdPill from "@components/account/PrincipalIdPill";
import { NNS_PLATFORM_URL } from "@constants/index";
import { useT } from "@i18n/LocaleContext";
import { useAddNeuron } from "./context";

const DialogAddNeuron = () => {
  const t = useT();
  const { show, handleClose, handleAddNeuron } = useAddNeuron();
  const { principalId } = useWallet();

  return (
    <Dialog
      show={show}
      handleClose={handleClose}
      panelClassName="max-w-[420px] rounded-[20px] bg-surface-1 border border-border-strong shadow-2xl"
      floatingClose
    >
      <div className="pt-10 pb-6 px-5 mx-auto w-full max-w-[420px] flex flex-col gap-7">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <div className="text-[22px] font-semibold leading-none text-content">
            {t("account.neurons.add.title")}
          </div>
          <div className="text-[13px] leading-snug text-muted max-w-[340px]">
            {t("account.neurons.add.description")}
          </div>
        </div>
        <PrincipalIdPill principalId={principalId} variant="long" showCopy />
        <Button
          onClick={handleAddNeuron}
          className="w-full !py-0 text-[14px] leading-[44px]"
        >
          {t("common.confirm")}
        </Button>
        <div className="text-center text-[12px] leading-none text-muted">
          {t("account.neurons.add.needHotkey")}{" "}
          <Link
            to={NNS_PLATFORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-content font-medium hover:underline"
          >
            {t("account.neurons.add.openNns")}
          </Link>
        </div>
      </div>
    </Dialog>
  );
};

export default DialogAddNeuron;
