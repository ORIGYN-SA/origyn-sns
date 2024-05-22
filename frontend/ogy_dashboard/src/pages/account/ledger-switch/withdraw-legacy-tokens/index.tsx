import { Link } from "react-router-dom";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { LEGACY_OGY_DASHBOARD_URL } from "@constants/index";
import { Button } from "@components/ui";

const WithdrawLegacyTokens = () => {
  return (
    <Link
      to={LEGACY_OGY_DASHBOARD_URL}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Button className="w-full">
        <div className="flex items-center justify-center">
          <div>Go to Legacy OGY dashboard</div>
          <div>
            <ArrowTopRightOnSquareIcon className="ml-2 h-5 w-5 text-background" />
          </div>
        </div>
      </Button>
    </Link>
  );
};

export default WithdrawLegacyTokens;
