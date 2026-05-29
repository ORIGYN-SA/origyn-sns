import { Link } from "react-router-dom";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { LEGACY_OGY_DASHBOARD_URL } from "@constants/index";
import { Button } from "@components/ui";
import { useT } from "@i18n/LocaleContext";

const WithdrawLegacyTokens = () => {
  const t = useT();
  return (
    <Link
      to={LEGACY_OGY_DASHBOARD_URL}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Button className="h-12 w-full !px-[25px] !py-0 text-[14px] leading-[48px] transition-colors hover:bg-charcoal2">
        <div className="flex items-center justify-center">
          <div>{t("account.ledgerSwitch.withdraw.goToLegacyDashboard")}</div>
          <div>
            <ArrowTopRightOnSquareIcon className="ms-2 h-5 w-5 text-background" />
          </div>
        </div>
      </Button>
    </Link>
  );
};

export default WithdrawLegacyTokens;
