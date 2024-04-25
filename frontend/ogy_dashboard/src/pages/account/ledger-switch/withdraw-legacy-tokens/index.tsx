import { Link } from "react-router-dom";
import { LEGACY_OGY_DASHBOARD_URL } from "@constants/index";
import { Button } from "@components/ui";

const WithdrawLegacyTokens = () => {
  return (
    <Link
      to={LEGACY_OGY_DASHBOARD_URL}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Button className="w-full">Go to Legacy OGY dashboard</Button>
    </Link>
  );
};

export default WithdrawLegacyTokens;
