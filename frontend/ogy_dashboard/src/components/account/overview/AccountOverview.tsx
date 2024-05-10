import { Fragment, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// import { useQuery, UseQueryResult } from "@tanstack/react-query";
// import { useConnect } from "@connect2ic/react";
import useConnect from "@hooks/useConnect";
import { Transition, Dialog } from "@headlessui/react";
import { Button } from "@components/ui";
import useFetchBalanceOGY from "@services/accounts/useFetchBalanceOGY";
import AuthButton from "@components/auth/Auth";

interface AccountOverviewProps {
  show: boolean;
  handleClose: () => void;
}

const AccountOverview = ({ show, handleClose }: AccountOverviewProps) => {
  const navigate = useNavigate();
  const { principalShort } = useConnect();
  const [balanceOGY, setBalanceOGY] = useState(0);
  const [balanceOGYUSD, setBalanceOGYUSD] = useState("0");

  const { data: dataBalanceOGY, isSuccess: isSuccessFetchBalanceOGY } =
    useFetchBalanceOGY({});
  // const {
  //   data: account,
  //   isLoading: isLoadingAccount,
  //   isError: isLoadingError,
  // }: UseQueryResult<Account> = useQuery(
  //   fetchOneAccount({ id: principal }, { retry: false })
  // );
  useEffect(() => {
    if (isSuccessFetchBalanceOGY) {
      setBalanceOGY(dataBalanceOGY.balanceOGY);
      setBalanceOGYUSD(dataBalanceOGY.balanceOGYUSD);
    }
  }, [isSuccessFetchBalanceOGY, dataBalanceOGY]);

  const handleClickAccount = () => {
    navigate("account");
    handleClose();
  };

  return (
    <Transition show={show} as={Fragment}>
      <div className="fixed z-50 inset-0 overflow-hidden">
        <Dialog as={Fragment} static open={show} onClose={handleClose}>
          <div className="absolute z-50 inset-0 overflow-hidden">
            <Transition.Child
              as={Fragment}
              enter="ease-in-out duration-500"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in-out duration-500"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
            </Transition.Child>
            <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <div className="bg-background px-8 py-5">
                  <div className="flex justify-end">
                    <AuthButton />
                  </div>
                  <div className="mt-8">{principalShort}</div>
                  <div className="bg-surface text-center mt-16 border border-border rounded-xl">
                    <div className="border-b border-border py-4">
                      Wallet Balance
                    </div>
                    <div className="grid grid-cols-1 gap-4 pb-8 px-32">
                      <div className="py-8">
                        <span className="text-2xl font-semibold">
                          {balanceOGY}
                        </span>
                        <span> OGY</span>
                        <div className="text-sm">($ {balanceOGYUSD})</div>
                      </div>
                      <Button className="px-8" onClick={handleClickAccount}>
                        My account
                      </Button>
                      <div>How to top up ?</div>
                    </div>
                  </div>
                </div>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </div>
    </Transition>
  );
};

export default AccountOverview;
