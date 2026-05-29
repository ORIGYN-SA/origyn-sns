import { Button } from "@components/ui";
import { useT } from "@i18n/LocaleContext";
import { useClaimReward } from "../context";

const BtnClaimReward = () => {
  const t = useT();
  const { handleShow, claimAmount, claimDisabledReason } = useClaimReward();
  return (
    <Button
      onClick={handleShow}
      disabled={claimAmount === 0 || !!claimDisabledReason}
      title={claimDisabledReason}
    >
      {t("account.neurons.claim.button")} {claimAmount} OGY
    </Button>
  );
};

export default BtnClaimReward;
