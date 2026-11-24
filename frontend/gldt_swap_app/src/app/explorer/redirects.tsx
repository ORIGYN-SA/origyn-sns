import { Navigate, useParams, useSearchParams } from "react-router-dom";

import { parsePrincipalAndSub } from "../icp/accounts";

/** /explorer/transactions/account?owner=…&subaccount=…: the account's transactions in the Explorer. */
export const ExplorerAccountRedirect = () => {
  const [params] = useSearchParams();
  const acct = parsePrincipalAndSub(params.get("owner") ?? "", params.get("subaccount") ?? "");
  return <Navigate to={acct ? `/explorer?w=${encodeURIComponent(acct.text)}` : "/explorer"} replace />;
};

/** /explorer/transaction/:index: that ledger block in the Explorer. */
export const ExplorerBlockRedirect = () => {
  const { index } = useParams();
  return <Navigate to={index && /^\d+$/.test(index) ? `/explorer?id=icp-${index}` : "/explorer"} replace />;
};
