/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { Principal } from "@dfinity/principal";
import { Button, Dialog, InputField, LoaderSpin } from "@components/ui";
import useFetchBalanceOGY from "@services/accounts/useFetchBalanceOGY";
import { TRANSACTION_FEE } from "@constants/index";
import { divideBy1e8, numberToE8s } from "@helpers/numbers";
import useTransfer from "@services/transfer/useTransfer";

const Transfer = ({ show, handleClose }) => {
  const queryClient = useQueryClient();
  const [transactionFee] = useState(divideBy1e8(TRANSACTION_FEE));

  const {
    data: balanceOGY,
    isSuccess: isSuccessFetchBalanceOGY,
    refetch: refetchFetchOGYBalance,
  } = useFetchBalanceOGY({});

  const {
    mutate: transfer,
    reset: resetTransfer,
    isSuccess: isSuccessTransfer,
    isError: isErrorTransfer,
    isPending: isPendingTransfer,
    isIdle: isIdleTransfer,
    // error: errorTransfer,
  } = useTransfer();

  const {
    register,
    handleSubmit,
    control,
    reset: resetForm,
    formState: { errors },
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
    return <div>{!isNaN(watchedAmount) ? watchedAmount : 0} OGY</div>;
  };

  const onSubmit = (data) => {
    transfer(
      { amount: numberToE8s(data.amount), to: data.recipientAddress },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["fetchBalanceOGY"],
          });
          refetchFetchOGYBalance();
        },
      }
    );
  };

  const isAmountUnderBalance = (value) => {
    if (balanceOGY && Number(value) && Number(value) > 0) {
      const balance = BigInt(balanceOGY.balanceOGYe8s);
      const amount = numberToE8s(value) + TRANSACTION_FEE;
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
    <Dialog show={show} handleClose={handleClose}>
      <div className="pt-12">
        {isSuccessFetchBalanceOGY && isIdleTransfer && (
          <div>
            <div className="text-center px-12">
              <div>Transfer OGY</div>
              <div className="text-sm text-content/60 mb-8">
                You can only send OGY from your available balance.
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
                        Number(v) > 0 || "Amount must be a positive number.",
                    },
                  })}
                  errors={errors?.amount}
                />
              </div>

              <div className="mb-12 px-12">
                <label htmlFor="recipientAddress">Recipient address</label>
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
                  <div>Amount</div>
                  <div className="flex items-center font-semibold">
                    <img
                      className="mx-2 h-4 w-4"
                      src="/ogy_logo.svg"
                      alt="OGY Logo"
                    />
                    <Amount />
                  </div>
                </div>
                <div className="flex justify-between items-center text-content/60">
                  <div>Transaction fee</div>
                  <div>{transactionFee} OGY</div>
                </div>
              </div>

              <div className="text-center mt-4 mb-8 px-12">
                <Button type="submit" className="w-full">
                  Transfer OGY
                </Button>
              </div>
            </form>

            <div className="bg-surface-2 rounded-b-xl border-t border-border flex justify-center items-center py-6 text-content/60">
              <div>Current balance: </div>
              <div className="flex items-center font-semibold">
                <img
                  className="mx-2 h-4 w-4"
                  src="/ogy_logo.svg"
                  alt="OGY Logo"
                />
                <span>{balanceOGY.balanceOGY} OGY</span>
              </div>
            </div>
          </div>
        )}
        {isSuccessFetchBalanceOGY && isPendingTransfer && (
          <div className="p-8 flex flex-col justify-center items-center">
            <LoaderSpin />
            <div className="mt-8 font-semibold text-xl">
              Transfer is being processed
            </div>
            <div className="text-content/60">This can take a few seconds</div>
          </div>
        )}
        {isSuccessFetchBalanceOGY && isSuccessTransfer && (
          <div className="p-8 flex flex-col justify-center items-center">
            <div className="font-semibold text-xl text-jade mb-8">
              Transfer was successful!
            </div>
            <Button className="mt-8 w-full" onClick={handleClose}>
              Close
            </Button>
          </div>
        )}
        {isSuccessFetchBalanceOGY && isErrorTransfer && (
          <div className="p-8 flex flex-col justify-center items-center">
            <div className="font-semibold text-xl text-red-500 mb-8">
              Transfer error!
            </div>
            <Button className="mt-8 w-full" onClick={handleClose}>
              Close
            </Button>
          </div>
        )}
        {!isSuccessFetchBalanceOGY && (
          <div className="flex justify-center items-center pb-12">
            <LoaderSpin />
          </div>
        )}
      </div>
    </Dialog>
  );
};

export default Transfer;
