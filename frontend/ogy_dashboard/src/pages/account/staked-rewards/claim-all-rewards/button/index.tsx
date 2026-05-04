import { Button } from "@components/ui";
import { useClaimAllRewards } from "../context";

const BtnClaimAllRewards = () => {
  const { handleShow, claimAmount } = useClaimAllRewards();
  return (
    <Button
      className="h-12 w-full !px-[25px] !py-0 text-[14px] leading-[48px] transition-colors hover:bg-charcoal2 disabled:hover:bg-content"
      onClick={handleShow}
      disabled={claimAmount === 0}
    >
      Claim all
    </Button>
  );
};

export default BtnClaimAllRewards;
