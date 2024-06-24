import { Button } from "@components/ui";
import { useClaimReward } from "../context";

const BtnClaimReward = () => {
  const { handleShow, claimAmount } = useClaimReward();
  return (
    <Button onClick={handleShow} disabled={claimAmount === 0}>
      Claim {claimAmount} OGY
    </Button>
  );
};

export default BtnClaimReward;
