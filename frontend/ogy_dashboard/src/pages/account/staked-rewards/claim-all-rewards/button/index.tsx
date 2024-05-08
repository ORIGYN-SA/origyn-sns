import { Button } from "@components/ui";
import { useClaimAllRewards } from "../context";

const BtnClaimAllRewards = () => {
  const { handleShow } = useClaimAllRewards();
  return (
    <Button className="w-full" onClick={handleShow}>
      Claim all
    </Button>
  );
};

export default BtnClaimAllRewards;
