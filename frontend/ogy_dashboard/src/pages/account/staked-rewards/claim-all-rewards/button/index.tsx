import { Button } from "@components/ui";
import { useClaimAllRewards } from "../context";
import { useT } from "@i18n/LocaleContext";

const BtnClaimAllRewards = () => {
  const t = useT();
  const { handleShow, claimAmount, claimDisabledReason } = useClaimAllRewards();
  return (
    <Button
      className="h-12 w-full !px-[25px] !py-0 text-[14px] leading-[48px] transition-colors hover:bg-charcoal2 disabled:hover:bg-content"
      onClick={handleShow}
      disabled={claimAmount === 0 || !!claimDisabledReason}
      title={claimDisabledReason}
    >
      {t("account.rewards.claimAll")}
    </Button>
  );
};

export default BtnClaimAllRewards;
