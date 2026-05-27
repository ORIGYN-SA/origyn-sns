import { Button } from "@components/ui";
import { useClaimReward } from "../context";

const BtnClaimReward = () => {
  const { handleShow, claimAmount, claimDisabledReason } = useClaimReward();
  return (
    <Button
      onClick={handleShow}
      disabled={claimAmount === 0 || !!claimDisabledReason}
      title={claimDisabledReason}
    >
      Claim {claimAmount} OGY
    </Button>
  );
};

export default BtnClaimReward;
