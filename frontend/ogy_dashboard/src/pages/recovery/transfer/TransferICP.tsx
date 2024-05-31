/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { Principal } from "@dfinity/principal";
import { Button, Dialog, InputField, LoaderSpin } from "@components/ui";
import useFetchBalanceICPOwner from "@hooks/accounts/useFetchBalanceICPOwner";
import { TRANSACTION_FEE_ICP, ICP_LEDGER_CANISTER_ID } from "@constants/index";
import { divideBy1e8, numberToE8s } from "@helpers/numbers";
import useTransferICP from "@hooks/transfer/useTransferICP";

const TransferICP = () => {
  const [show, setShow] = useState(false);
  const handleShow = () => setShow(true);
  const handleClose = () => {
    setShow(false);
  };

  const queryClient = useQueryClient();
  const [transactionFee] = useState(divideBy1e8(TRANSACTION_FEE_ICP));

  const { data: balanceICP, isSuccess: isSuccessFetchBalanceICP } =
    useFetchBalanceICPOwner();

  const {
    mutate: transfer,
    reset: resetTransfer,
    isSuccess: isSuccessTransfer,
    isError: isErrorTransfer,
    isPending: isPendingTransfer,
    isIdle: isIdleTransfer,
    // error: errorTransfer,
  } = useTransferICP();

  const {
    register,
    handleSubmit,
    control,
    reset: resetForm,
    formState: { errors, isValid },
  } = useForm({
    mode: "onChange",
    shouldUnregister: true,
  });

  useEffect(() => {
    return () => {
      if (!show) {
        resetForm();
        resetTransfer();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  const Amount = () => {
    const watchedAmount = useWatch({
      name: "amount",
      control,
      defaultValue: 0,
    });
    return (
      <div>
        {isNaN(watchedAmount) ||
        watchedAmount === 0 ||
        Object.keys(errors).length > 0
          ? 0
          : watchedAmount}{" "}
        ICP
      </div>
    );
  };

  const onSubmit = (data) => {
    transfer(
      { amount: numberToE8s(data.amount), to: data.recipientAddress },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["userFetchBalanceICP"],
          });
        },
      }
    );
  };

  const isAmountUnderBalance = (value) => {
    if (balanceICP && Number(value) && Number(value) > 0) {
      const balance = balanceICP.balance.e8s;
      const amount = numberToE8s(value);
      if (amount > balance) return false;
    }
    return true;
  };

  const isValidRecipientAddress = (value) => {
    try {
      Principal.fromText(value);
      return true;
    } catch (err) {
      return false;
    }
  };

  return (
    <>
      {!isSuccessFetchBalanceICP && (
        <div className="flex flex-col items-center">
          <LoaderSpin />
        </div>
      )}
      {isSuccessFetchBalanceICP && (
        <>
          <div className="bg-surface border border-border rounded-xl">
            <div className="p-6">
              Ledger canister: <span>{ICP_LEDGER_CANISTER_ID}</span>
            </div>
            <div className="flex justify-between text-2xl p-6">
              <div className="font-semibold">Balance</div>
              <div className="flex items-center font-semibold">
                <img
                  className="mx-2 h-4 w-4"
                  src="/icp_logo.svg"
                  alt="ICP Logo"
                />
                <span>{balanceICP.number.balance} ICP</span>
              </div>
            </div>
          </div>
          <Button
            className="w-full mt-8"
            onClick={handleShow}
            disabled={!balanceICP?.number.balance}
          >
            Transfer ICP
          </Button>
          <Dialog show={show} handleClose={handleClose}>
            <div className="pt-12">
              {isSuccessFetchBalanceICP && isIdleTransfer && (
                <div>
                  <div className="text-center px-12">
                    <div>Transfer ICP</div>
                    <div className="text-sm text-content/60 mb-8">
                      You can only send ICP from your available balance.
                    </div>
                  </div>
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="my-8 px-12">
                      <label htmlFor="amount">Amount</label>
                      <InputField
                        id="amount"
                        type="text"
                        register={register("amount", {
                          pattern: /[0-9.]/,
                          valueAsNumber: true,
                          required: "Amount is required.",
                          validate: {
                            isAmountUnderBalance: (v) =>
                              isAmountUnderBalance(v) ||
                              "Amount must not exceed your balance.",
                            isPositive: (v) =>
                              Number(v) > 0 ||
                              "Amount must be a positive number.",
                            isAmountUpperBalance: (v) =>
                              Number(v) >=
                                divideBy1e8(Number(TRANSACTION_FEE_ICP)) ||
                              "Amount must be greater the or equal to transaction fees.",
                          },
                        })}
                        errors={errors?.amount}
                      />
                    </div>

                    <div className="mb-12 px-12">
                      <label htmlFor="recipientAddress">
                        Recipient address
                      </label>
                      <InputField
                        id="recipientAddress"
                        type="text"
                        register={register("recipientAddress", {
                          required: "Recipient address is required.",
                          validate: {
                            isValidRecipientAddress: (v) =>
                              isValidRecipientAddress(v) ||
                              "Invalid recipient address.",
                          },
                        })}
                        errors={errors?.recipientAddress}
                      />
                    </div>

                    <div className="border-t border-border px-12 py-4">
                      <div className="flex justify-between items-center font-bold pt-4">
                        <div>Amount Received</div>
                        <div className="flex items-center font-semibold">
                          <img
                            className="mx-2 h-4 w-4"
                            src="/icp_logo.svg"
                            alt="ICP Logo"
                          />
                          <Amount />
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-content/60">
                        <div>Transaction fee</div>
                        <div>{transactionFee} ICP</div>
                      </div>
                    </div>

                    <div className="text-center mt-4 mb-8 px-12">
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={!isValid}
                      >
                        Transfer ICP
                      </Button>
                    </div>
                  </form>

                  <div className="bg-surface-2 rounded-b-xl border-t border-border flex justify-center items-center py-6 text-content/60">
                    <div>Current balance: </div>
                    <div className="flex items-center font-semibold">
                      <img
                        className="mx-2 h-4 w-4"
                        src="/icp_logo.svg"
                        alt="ICP Logo"
                      />
                      <span>{balanceICP.number.balance} ICP</span>
                    </div>
                  </div>
                </div>
              )}
              {isSuccessFetchBalanceICP && isPendingTransfer && (
                <div className="p-8 flex flex-col justify-center items-center">
                  <LoaderSpin />
                  <div className="mt-8 font-semibold text-xl">
                    Transfer is being processed
                  </div>
                  <div className="text-content/60">
                    This can take a few seconds
                  </div>
                </div>
              )}
              {isSuccessFetchBalanceICP && isSuccessTransfer && (
                <div className="p-8 flex flex-col justify-center items-center">
                  <div className="font-semibold text-xl text-jade mb-8">
                    Transfer was successful!
                  </div>
                  <Button className="mt-8 w-full" onClick={handleClose}>
                    Close
                  </Button>
                </div>
              )}
              {isSuccessFetchBalanceICP && isErrorTransfer && (
                <div className="p-8 flex flex-col justify-center items-center">
                  <div className="font-semibold text-xl text-red-500 mb-8">
                    Transfer error!
                  </div>
                  <Button className="mt-8 w-full" onClick={handleClose}>
                    Close
                  </Button>
                </div>
              )}
              {!isSuccessFetchBalanceICP && (
                <div className="flex justify-center items-center pb-12">
                  <LoaderSpin />
                </div>
              )}
            </div>
          </Dialog>
        </>
      )}
    </>
  );
};

export default TransferICP;
