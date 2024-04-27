/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Button, Dialog } from "@components/ui";

// yup.addMethod(yup.string, "positiveBalance", async function (errorMessage) {
//   return this.test(`positive-balance`, errorMessage, function (value) {
//     const { path, createError } = this;
//     return (
//       (value && value.length === 16) ||
//       createError({ path, message: errorMessage })
//     );
//   });
// });

const schema = yup.object({
  amount: yup
    .number()
    .positive()
    .integer()
    .required()
    .test(
      "positiveBalance",
      "Amount should not exceed your balance.",
      (value) => {
        return 10 - value >= 0;
      }
    ),
  recipientAddress: yup.string().required(),
});

const Transfer = () => {
  const [show, setShow] = useState(false);

  const handleShow = () => setShow(true);
  const handleClose = () => setShow(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onChange",
    shouldUnregister: true,
  });
  const onSubmit = (data) => {
    if (5 - data.amount < 0) {
      setError("amount", {
        type: "custom",
        message: "Amount should not exceed your balance.",
      });
    }
    console.log(data);
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

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="my-8">
              <label htmlFor="amount">Amount</label>
              <input
                id="amount"
                type="number"
                {...register("amount")}
                className="form-input px-4 py-3 mt-2 rounded-full w-full bg-surface-2 outline-none focus:outline-none focus:border-none"
              />
              <p>{errors.amount?.message}</p>
            </div>

            <div className="mb-8">
              <label htmlFor="recipientAddress">Recipient address</label>
              <input
                id="recipientAddress"
                type="text"
                {...register("recipientAddress")}
                className="form-input px-4 py-3 mt-2 rounded-full w-full bg-surface-2 outline-none focus:outline-none focus:border-none"
              />
              <p>{errors.recipientAddress?.message}</p>
            </div>

            <div className="text-center mt-16">
              <Button type="submit" className="w-full">
                Transfer OGY
              </Button>
            </div>
          </form>
        </div>
      </Dialog>
    </>
  );
};

export default Transfer;
