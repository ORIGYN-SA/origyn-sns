/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button, Dialog, InputField, LoaderSpin } from "@components/ui";
import useFetchBalanceOGY from "@services/accounts/useFetchBalanceOGY";
import { TRANSACTION_FEE } from "@constants/index";
import { divideBy1e8, numberToE8s } from "@helpers/numbers";

const Transfer = () => {
  const [show, setShow] = useState(true);
  const handleShow = () => setShow(true);
  const handleClose = () => setShow(false);
  const [transactionFee] = useState(divideBy1e8(TRANSACTION_FEE));

  const { data: balanceOGY, isSuccess: isSuccessFetchBalanceOGY } =
    useFetchBalanceOGY({});

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    mode: "onChange",
    shouldUnregister: true,
  });

  const Amount = () => {
    const watchedAmount = useWatch({
      name: "amount",
      control,
      defaultValue: 0,
    });
    return <div>{!isNaN(watchedAmount) ? watchedAmount : 0} OGY</div>;
  };

  const onSubmit = (data) => {
    console.log(data);
    console.log(typeof data.amount);
  };

  const isAmountUnderBalance = (value) => {
    if (balanceOGY && Number(value) && Number(value) > 0) {
      const balance = BigInt(balanceOGY.balanceOGYe8s);
      const amount = numberToE8s(value) + TRANSACTION_FEE;
      if (amount > balance) return false;
    }
    return true;
  };

  return (
    <>
      <Button className="w-full" onClick={handleShow}>
        Transfer
      </Button>
      <Dialog show={show} handleClose={handleClose}>
        <div className="p-12">
          <div className="text-center">
            <div>Transfer OGY</div>
            <div className="text-sm text-content/60 mb-8">
              You can only send OGY from your available balance.
            </div>
          </div>
          {isSuccessFetchBalanceOGY && (
            <div>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="my-8">
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

                <div className="mb-8">
                  <label htmlFor="recipientAddress">Recipient address</label>
                  <InputField
                    id="recipientAddress"
                    type="text"
                    register={register("recipientAddress", {
                      required: "Recipient address is required.",
                    })}
                    errors={errors?.recipientAddress}
                  />
                </div>

                <div className="text-center mt-16">
                  <Button type="submit" className="w-full">
                    Transfer OGY
                  </Button>
                </div>
              </form>
              <div>
                <div className="flex justify-between items-center font-bold px-4 pt-4">
                  <div className="">Amount</div>
                  <Amount />
                </div>
                <div className="flex justify-between items-center text-content/60 px-4 pb-4">
                  <div>Transaction fee</div>
                  <div>{transactionFee} OGY</div>
                </div>
              </div>
            </div>
          )}
          {!isSuccessFetchBalanceOGY && (
            <div className="flex justify-center items-center">
              <LoaderSpin />
            </div>
          )}
        </div>
      </Dialog>
    </>
  );
};

export default Transfer;
