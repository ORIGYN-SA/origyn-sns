import { Dialog, Button } from "@components/ui";
import { useRemoveNeuron } from "./context";
import { useWallet } from "@components/auth/useWallet";
import PrincipalIdPill from "@components/account/PrincipalIdPill";
import { useT } from "@i18n/LocaleContext";

const DialogRemoveNeuron = () => {
  const t = useT();
  const { principalId } = useWallet();
  const { show, handleClose, handleRemoveNeuron } = useRemoveNeuron();

  return (
    <Dialog show={show} handleClose={handleClose}>
      <div className="px-12 pb-12">
        <div className="text-center mt-2">
          <div className="text-lg font-semibold">
            {t("account.neurons.remove.title")}
          </div>
          <div className="mt-4 text-content/60">
            {t("account.neurons.remove.description")}
          </div>
          <div className="mt-6">
            <PrincipalIdPill
              principalId={principalId}
              variant="long"
              showCopy
            />
          </div>
          <div className="flex justify-center items-center mt-8 gap-4">
            <Button onClick={handleRemoveNeuron}>{t("common.confirm")}</Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default DialogRemoveNeuron;
