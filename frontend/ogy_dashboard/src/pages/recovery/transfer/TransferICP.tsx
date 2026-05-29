import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { Principal } from "@dfinity/principal";
import { Button, Dialog, InputField, LoaderSpin } from "@components/ui";
import { useT } from "@i18n/LocaleContext";
import useFetchBalanceICPOwner from "@hooks/accounts/useFetchBalanceICPOwner";
import { TRANSACTION_FEE_ICP, ICP_LEDGER_CANISTER_ID } from "@constants/index";
import { divideBy1e8, numberToE8s } from "@helpers/numbers";
import useTransferICP from "@hooks/transfer/useTransferICP";

type TransferICPFormValues = {
  amount: string;
  recipientAddress: string;
};

const TransferICP = () => {
  const t = useT();
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
  } = useForm<TransferICPFormValues>({
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
      defaultValue: "",
    });
    const numericAmount = Number(watchedAmount);
    return (
      <div>
        {!watchedAmount ||
        isNaN(numericAmount) ||
        numericAmount === 0 ||
        Object.keys(errors).length > 0
          ? 0
          : numericAmount}{" "}
        ICP
      </div>
    );
  };

  const onSubmit = (data: TransferICPFormValues) => {
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

  const isAmountUnderBalance = (value: string) => {
    if (balanceICP && Number(value) && Number(value) > 0) {
      const balance = balanceICP.balance.e8s;
      const amount = numberToE8s(value);
      if (amount > balance) return false;
    }
    return true;
  };

  const isValidRecipientAddress = (value: string) => {
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
              {t("recovery.transfer.ledgerCanister")}{" "}
              <span dir="ltr" className="inline-block">
                {ICP_LEDGER_CANISTER_ID}
              </span>
            </div>
            <div className="flex justify-between text-2xl p-6">
              <div className="font-semibold">{t("common.balance")}</div>
              <div dir="ltr" className="flex items-center font-semibold">
                <img
                  className="mx-2 h-4 w-4"
                  src="/icp_logo.svg"
                  alt={t("recovery.transfer.icpLogoAlt")}
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
            {t("recovery.transfer.transferIcp")}
          </Button>
          <Dialog show={show} handleClose={handleClose}>
            <div className="pt-12">
              {isSuccessFetchBalanceICP && isIdleTransfer && (
                <div>
                  <div className="text-center px-12">
                    <div>{t("recovery.transfer.transferIcp")}</div>
                    <div className="text-sm text-content/60 mb-8">
                      {t("recovery.transfer.availableBalanceNote")}
                    </div>
                  </div>
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="my-8 px-12">
                      <label htmlFor="amount">{t("common.amount")}</label>
                      <InputField
                        id="amount"
                        type="text"
                        register={register("amount", {
                          required: t("recovery.transfer.amountRequired"),
                          validate: {
                            isAmountUnderBalance: (v) =>
                              isAmountUnderBalance(v) ||
                              t("recovery.transfer.amountExceedsBalance"),
                            isPositive: (v) =>
                              Number(v) > 0 ||
                              t("recovery.transfer.amountPositive"),
                            isAmountUpperBalance: (v) =>
                              Number(v) >=
                                divideBy1e8(Number(TRANSACTION_FEE_ICP)) ||
                              t("recovery.transfer.amountBelowFee"),
                          },
                        })}
                        errors={errors?.amount}
                      />
                    </div>

                    <div className="mb-12 px-12">
                      <label htmlFor="recipientAddress">
                        {t("recovery.transfer.recipientAddress")}
                      </label>
                      <InputField
                        id="recipientAddress"
                        type="text"
                        register={register("recipientAddress", {
                          required: t(
                            "recovery.transfer.recipientAddressRequired"
                          ),
                          validate: {
                            isValidRecipientAddress: (v) =>
                              isValidRecipientAddress(v) ||
                              t("recovery.transfer.invalidRecipientAddress"),
                          },
                        })}
                        errors={errors?.recipientAddress}
                      />
                    </div>

                    <div className="border-t border-border px-12 py-4">
                      <div className="flex justify-between items-center font-bold pt-4">
                        <div>{t("recovery.transfer.amountReceived")}</div>
                        <div dir="ltr" className="flex items-center font-semibold">
                          <img
                            className="mx-2 h-4 w-4"
                            src="/icp_logo.svg"
                            alt={t("recovery.transfer.icpLogoAlt")}
                          />
                          <Amount />
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-content/60">
                        <div>{t("recovery.transfer.transactionFee")}</div>
                        <div dir="ltr">{transactionFee} ICP</div>
                      </div>
                    </div>

                    <div className="text-center mt-4 mb-8 px-12">
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={!isValid}
                      >
                        {t("recovery.transfer.transferIcp")}
                      </Button>
                    </div>
                  </form>

                  <div className="bg-surface-2 rounded-b-xl border-t border-border flex justify-center items-center py-6 text-content/60">
                    <div>{t("recovery.transfer.currentBalance")} </div>
                    <div dir="ltr" className="flex items-center font-semibold">
                      <img
                        className="mx-2 h-4 w-4"
                        src="/icp_logo.svg"
                        alt={t("recovery.transfer.icpLogoAlt")}
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
                    {t("recovery.transfer.processing")}
                  </div>
                  <div className="text-content/60">
                    {t("recovery.transfer.processingNote")}
                  </div>
                </div>
              )}
              {isSuccessFetchBalanceICP && isSuccessTransfer && (
                <div className="p-8 flex flex-col justify-center items-center">
                  <div className="font-semibold text-xl text-jade mb-8">
                    {t("recovery.transfer.success")}
                  </div>
                  <Button className="mt-8 w-full" onClick={handleClose}>
                    {t("common.close")}
                  </Button>
                </div>
              )}
              {isSuccessFetchBalanceICP && isErrorTransfer && (
                <div className="p-8 flex flex-col justify-center items-center">
                  <div className="font-semibold text-xl text-red-500 mb-8">
                    {t("recovery.transfer.error")}
                  </div>
                  <Button className="mt-8 w-full" onClick={handleClose}>
                    {t("common.close")}
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
