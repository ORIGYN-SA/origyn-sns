import { Navigate, useParams } from "react-router-dom";
import { useLocalePath } from "@i18n/LocaleContext";

const TxHistory = () => {
  const params = useParams();
  const lp = useLocalePath();

  return (
    <Navigate
      to={lp(`/transaction-history/transactions/accounts/${params.accountId}`)}
      replace
    />
  );
};

export default TxHistory;
