import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { decodeIcrcAccount } from "@dfinity/ledger-icrc";
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

type TransferFormValues = {
  amount: string;
  recipientAddress: string;
};

type TransferProps = {
  show: boolean;
  handleClose: () => void;
};

const Transfer = ({ show, handleClose }: TransferProps) => {
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
  } = useTransferOGY();

  const {
    register,
    handleSubmit,
    control,
    reset: resetForm,
    setValue,
    setFocus,
    formState: { errors, isValid, dirtyFields },
  } = useForm<TransferFormValues>({
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
      defaultValue: "",
    });
    const numericAmount = Number(watchedAmount);
    const total = divideBy1e8(
      numericAmount * 100000000 - Number(TRANSACTION_FEE)
    );
    return (
      <div>
        {!watchedAmount ||
        isNaN(numericAmount) ||
        numericAmount === 0 ||
        errors?.amount
          ? 0
          : total}{" "}
        OGY
      </div>
    );
  };

  const onSubmit = (data: TransferFormValues) => {
    transfer(
      { amount: numberToE8s(data.amount), to: data.recipientAddress },
      {
        onSuccess: (result) => {
          if (Object.keys(result)[0] !== "Ok") {
            throw new Error(Object.keys(result.Err).toString());
          } else {
            queryClient.invalidateQueries({
              queryKey: ["userFetchBalanceOGY"],
            });
          }
        },
      }
    );
  };

  const isAmountUnderBalance = (value: string) => {
    if (balanceOGY && Number(value) && Number(value) > 0) {
      const balance = BigInt(balanceOGY.balanceE8s);
      const amount = numberToE8s(value);
      if (amount > balance) return false;
    }
    return true;
  };

  const isAmountUpperFee = (value: string) => {
    if (balanceOGY && Number(value) && Number(value) > 0) {
      const amount = numberToE8s(value);
      if (amount < TRANSACTION_FEE) return false;
    }
    return true;
  };

  const isValidRecipientAddress = (value: string) => {
    try {
      decodeIcrcAccount(value);
      return true;
    } catch (err) {
      return false;
    }
  };

  const handleSetAmountMaxBalance = () => {
    if (!balanceOGY) return;
    const value = divideBy1e8(balanceOGY.balanceE8s);
    setValue("amount", value > 0 ? String(value) : "0", {
      shouldValidate: true,
    });
    setFocus("recipientAddress");
  };

  return (
    <Dialog
      show={show}
      handleClose={handleClose}
      panelClassName="max-w-[480px] rounded-[20px] bg-surface-1 border border-border-strong shadow-2xl"
      floatingClose
    >
      {isSuccessFetchBalanceOGY && isIdleTransfer && (
        <div className="pt-10 pb-6 px-5 mx-auto w-full max-w-[480px] flex flex-col gap-7">
          <div className="flex flex-col items-center gap-1.5 text-center">
            <div className="text-[22px] font-semibold leading-none text-content">
              Transfer OGY
            </div>
            <div className="text-[13px] leading-snug text-muted max-w-[340px]">
              You can only send OGY from your available balance.
            </div>
          </div>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
          >
            <div>
              <div className="flex justify-between items-center">
                <label
                  htmlFor="amount"
                  className="text-[13px] font-medium text-content"
                >
                  Amount
                </label>
                <button
                  onClick={handleSetAmountMaxBalance}
                  type="button"
                  className="flex items-center gap-1 text-[12px] font-medium text-accent hover:underline"
                >
                  <ArrowUpTrayIcon className="h-3.5 w-3.5" />
                  Max
                </button>
              </div>
              <InputField
                id="amount"
                type="text"
                register={register("amount", {
                  required: "Amount is required.",
                  validate: {
                    isAmountUnderBalance: (v) =>
                      isAmountUnderBalance(v) ||
                      "Amount must not exceed your balance.",
                    isAmountUpperFee: (v) =>
                      isAmountUpperFee(v) ||
                      "Amount must not be less than transaction fee.",
                    isPositive: (v) =>
                      Number(v) > 0 || "Amount must be a positive number.",
                  },
                })}
                errors={errors?.amount}
              />
            </div>

            <div>
              <label
                htmlFor="recipientAddress"
                className="text-[13px] font-medium text-content"
              >
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
                errors={
                  Object.keys(dirtyFields).length !== 0
                    ? errors?.recipientAddress
                    : undefined
                }
              />
            </div>

            <div className="rounded-2xl border border-border-strong bg-surface-faint p-4 flex flex-col gap-2">
              <div className="flex justify-between items-center text-[14px]">
                <div className="text-content">Amount Received</div>
                <div className="flex items-center font-medium text-content">
                  <img
                    className="mr-2 h-4 w-4"
                    src="/ogy_logo.svg"
                    alt="OGY Logo"
                  />
                  <Amount />
                </div>
              </div>
              <div className="flex justify-between items-center text-[12px] text-muted">
                <div>Transaction fee (billed to source)</div>
                <div>{transactionFee} OGY</div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={!isValid}
              className="w-full !py-0 text-[14px] leading-[44px]"
            >
              Transfer OGY
            </Button>
          </form>

          <div className="text-center text-[12px] leading-none text-muted">
            Current balance:{" "}
            <span className="font-medium text-content">
              {balanceOGY.balance} OGY
            </span>
          </div>
        </div>
      )}
      {isSuccessFetchBalanceOGY && isPendingTransfer && (
        <div className="pt-10 pb-10 px-5 mx-auto w-full max-w-[480px] flex flex-col items-center gap-5">
          <LoaderSpin />
          <div className="flex flex-col items-center gap-1.5 text-center">
            <div className="text-[18px] font-semibold leading-none text-content">
              Transfer is being processed
            </div>
            <div className="text-[13px] leading-snug text-muted">
              This can take a few seconds
            </div>
          </div>
        </div>
      )}
      {isSuccessFetchBalanceOGY && isSuccessTransfer && (
        <div className="pt-10 pb-6 px-5 mx-auto w-full max-w-[480px] flex flex-col items-center gap-5">
          <CheckCircleIcon className="h-16 w-16 text-jade" />
          <div className="text-[22px] font-semibold leading-none text-content text-center">
            Transfer was successful !
          </div>
          <Button
            onClick={handleClose}
            className="w-full !py-0 text-[14px] leading-[44px]"
          >
            Close
          </Button>
        </div>
      )}
      {isSuccessFetchBalanceOGY && isErrorTransfer && (
        <div className="pt-10 pb-6 px-5 mx-auto w-full max-w-[480px] flex flex-col items-center gap-5">
          <XCircleIcon className="h-16 w-16 text-red-400" />
          <div className="text-[22px] font-semibold leading-none text-content text-center">
            Transfer error !
          </div>
          <div className="w-full rounded-2xl border border-border-strong bg-surface-faint px-4 py-3 text-[13px] leading-snug text-content max-h-40 overflow-auto break-words">
            {errorTransfer?.message}
          </div>
          <Button
            onClick={handleClose}
            className="w-full !py-0 text-[14px] leading-[44px]"
          >
            Close
          </Button>
        </div>
      )}
      {!isSuccessFetchBalanceOGY && (
        <div className="pt-10 pb-10 px-5 flex justify-center items-center">
          <LoaderSpin />
        </div>
      )}
    </Dialog>
  );
};

export default Transfer;
