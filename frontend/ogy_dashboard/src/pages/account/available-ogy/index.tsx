import { useState } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "@components/auth/useWallet";
import { Button } from "@components/ui";
import BalanceCard from "@components/account/BalanceCard";
import Transfer from "./transfer/Transfer";
import useFetchBalanceOGYOwner from "@hooks/accounts/useFetchBalanceOGYOwner";
import useFetchBalanceOGYUSD from "@hooks/accounts/useFetchBalanceOGYUSD";

const ACTION_BUTTON_CLASS =
  "h-12 w-full !px-[25px] !py-0 text-[14px] leading-[48px] transition-colors hover:bg-charcoal2";

const AvailableOGY = () => {
  const { accountId } = useWallet();
  const [show, setShow] = useState(false);
  const handleShow = () => setShow(true);
  const handleClose = () => setShow(false);

  const { data: balanceOGY } = useFetchBalanceOGYOwner();
  const {
    data: balanceOGYUSD,
    isLoading: isBalanceUsdLoading,
    isError: isBalanceUsdError,
  } = useFetchBalanceOGYUSD({ balance: balanceOGY?.balance });

  const isBalanceLoading = balanceOGY?.balance === undefined;
  const isUsdLoading = isBalanceLoading || isBalanceUsdLoading;

  return (
    <BalanceCard
      title="Available OGY"
      headerAction={
        <Link
          to={`/transaction-history/transactions/accounts/${accountId}#transaction-history-table`}
          className="font-medium text-xs leading-none text-accent"
        >
          Transaction history
        </Link>
      }
      balance={balanceOGY?.string.balance}
      isBalanceLoading={isBalanceLoading}
      usd={balanceOGYUSD}
      isUsdLoading={isUsdLoading}
      isUsdError={isBalanceUsdError}
      action={
        <>
          <Button className={ACTION_BUTTON_CLASS} onClick={handleShow}>
            Transfer
          </Button>
          <Transfer show={show} handleClose={handleClose} />
        </>
      }
    />
  );
};

export default AvailableOGY;
