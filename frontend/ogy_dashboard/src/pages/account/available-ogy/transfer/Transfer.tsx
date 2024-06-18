/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { Principal } from "@dfinity/principal";
import {
  ArrowUpTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { Button, Dialog, InputField, LoaderSpin } from "@components/ui";
import useFetchBalanceOGYOwner from "@hooks/accounts/useFetchBalanceOGYOwner";
import { TRANSACTION_FEE } from "@constants/index";
import { divideBy1e8, numberToE8s } from "@helpers/numbers";
import useTransferOGY from "@hooks/transfer/useTransferOGY";

const Transfer = ({ show, handleClose }) => {
  const queryClient = useQueryClient();
  const [transactionFee] = useState(divideBy1e8(TRANSACTION_FEE));

  const { data: balanceOGY, isSuccess: isSuccessFetchBalanceOGY } =
    useFetchBalanceOGYOwner();

  const {
    mutate: transfer,
    reset: resetTransfer,
    isSuccess: isSuccessTransfer,
    isError: isErrorTransfer,
    isPending: isPendingTransfer,
    isIdle: isIdleTransfer,
    error: errorTransfer,
    // error: errorTransfer,
  } = useTransferOGY();

  const {
    register,
    handleSubmit,
    control,
    reset: resetForm,
    setValue,
    setFocus,
    formState: { errors, isValid, dirtyFields },
  } = useForm({
    mode: "onChange",
    shouldUnregister: true,
    shouldFocusError: false,
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
    const total = divideBy1e8(
      Number(watchedAmount) * 100000000 + Number(TRANSACTION_FEE)
    );
    return (
      <div>
        {isNaN(watchedAmount) || watchedAmount === 0 || errors?.amount
          ? 0
          : total.toFixed(3)}{" "}
        OGY
      </div>
    );
  };

  const onSubmit = (data) => {
    transfer(
      { amount: numberToE8s(data.amount), to: data.recipientAddress },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["userFetchBalanceOGY"],
          });
        },
      }
    );
  };

  const isAmountUnderBalance = (value) => {
    if (balanceOGY && Number(value) && Number(value) > 0) {
      const balance = BigInt(balanceOGY.balanceE8s);
      const amount = numberToE8s(value);
      if (amount > balance - TRANSACTION_FEE) return false;
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

  const handleSetAmountMaxBalance = () => {
    const value = divideBy1e8(balanceOGY.balanceE8s - TRANSACTION_FEE);
    setValue("amount", value > 0 ? value.toFixed(3) : 0, {
      shouldValidate: true,
    });
    setFocus("recipientAddress");
  };

  return (
    <Dialog show={show} handleClose={handleClose}>
      <div className="pt-6">
        {isSuccessFetchBalanceOGY && isIdleTransfer && (
          <div>
            <div className="text-center px-12">
              <div className="font-bold text-lg">Transfer OGY</div>
              <div className="text-sm text-content/60 mb-12">
                You can only send OGY from your available balance.
              </div>
            </div>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="my-8 px-12">
                <div className="flex justify-between items-center">
                  <label htmlFor="amount">Amount</label>
                  <button onClick={handleSetAmountMaxBalance} type="button">
                    <div className="bg-accent px-4 py-1 rounded-full text-white flex items-center">
                      <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                      Max
                    </div>
                  </button>
                </div>
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
                  // ? Object.keys(dirtyFields).length !== 0 fix form set errors when amount is setted via max button
                  errors={
                    Object.keys(dirtyFields).length !== 0 &&
                    errors?.recipientAddress
                  }
                />
              </div>

              <div className="border-t border-border px-12 py-4">
                <div className="flex justify-between items-center font-bold pt-4">
                  <div>Amount Received</div>
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
                  <div>Transaction fee (billed to source)</div>
                  <div>{transactionFee} OGY</div>
                </div>
              </div>

              <div className="text-center mt-4 mb-8 px-12">
                <Button type="submit" className="w-full" disabled={!isValid}>
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
                <span>{balanceOGY.balance} OGY</span>
              </div>
            </div>
          </div>
        )}
        {isSuccessFetchBalanceOGY && isPendingTransfer && (
          <div className="px-4 pb-12 flex flex-col justify-center items-center">
            <LoaderSpin />
            <div className="font-semibold text-xl mt-8">
              Transfer is being processed
            </div>
            <div className="text-content/60">This can take a few seconds</div>
          </div>
        )}
        {isSuccessFetchBalanceOGY && isSuccessTransfer && (
          <div className="px-4 pb-12 flex flex-col justify-center items-center">
            <CheckCircleIcon className="h-24 w-24 text-jade mb-4" />
            <div className="font-semibold text-xl mb-8">
              Transfer was successful !
            </div>
            <Button className="px-8" onClick={handleClose}>
              Close
            </Button>
          </div>
        )}
        {isSuccessFetchBalanceOGY && isErrorTransfer && (
          <div className="px-4 pb-12 flex flex-col justify-center items-center">
            <XCircleIcon className="h-24 w-24 text-red-400 mb-4" />
            <div className="font-semibold text-xl mb-8">Transfer error !</div>
            <div className="bg-surface-3 p-4 rounded-xl">
              {errorTransfer?.message}
            </div>
            <Button className="mt-10 px-8" onClick={handleClose}>
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
