import { Navigate, useParams } from "react-router-dom";

const TxHistory = () => {
  const params = useParams();
  return (
    <Navigate
      to={`/transaction-history/transactions/accounts/${params.accountId}`}
      replace
    />
  );
};

export default TxHistory;
