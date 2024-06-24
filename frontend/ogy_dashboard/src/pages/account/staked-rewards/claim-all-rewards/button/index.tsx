import { Button } from "@components/ui";
import { useClaimAllRewards } from "../context";

const BtnClaimAllRewards = () => {
  const { handleShow, claimAmount } = useClaimAllRewards();
  return (
    <Button
      className="w-full"
      onClick={handleShow}
      disabled={claimAmount === 0}
    >
      Claim all
    </Button>
  );
};

export default BtnClaimAllRewards;
