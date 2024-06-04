/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { Button, InputField, Card } from "@components/ui";
import { toast } from "react-hot-toast";
import { Principal } from "@dfinity/principal";
import sendSupportRequest from "@services/queries/support/sendSupportRequest";
import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import useCreateSupportTicket from "./useCreateSupportTicket";

const Support = () => {
  const mutation = useCreateSupportTicket();

  const {
    isSuccess,
    isError,
    isPending,
  } = mutation;

  const onSubmit = (data: any) => {
    mutation.mutate(
      data,
      {
        onSuccess: (data) => {
          toast.error(error?.message || "Support ticket was created");
        },
        onError: (error) => {
          toast.error(error?.message || "Error");
        },
      })
  };

  const isValidRecipientAddress = (value: string) => {
    try {
      Principal.fromText(value);
      return true;
    } catch (err) {
      return false;
    }
  };

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

  return (
    <div className="container mx-auto py-16 px-4">
      <div className="flex flex-col items-center">
        <section className="w-full" id="total-ogy-supply">
          <Card>
            {
              isSuccess ? (
                <>
                  <div className="text-center px-12">
                    <div>Support ticket was created</div>
                    <br />
                    <div className="text-sm text-content/60">
                      Please wait for our responce to the email address you specified.
                    </div>
                  </div>
                </>
              ) : (
                <>
                <div className="text-center px-12">
                  <div>Create a support ticket</div>
                  <div className="text-sm text-content/60 mb-8">
                    Describe your issue and provide your contacts.
                  </div>
                </div>
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="my-8 px-12">
                    <label htmlFor="amount">Name</label>
                    <InputField
                      id="name"
                      type="text"
                      register={register("name", {
                      })}
                      errors={errors?.name}
                    />
                  </div>
                  <div className="my-8 px-12">
                    <label htmlFor="amount">Contact Email</label>
                    <InputField
                      id="email"
                      type="text"
                      register={register("email", {
                        required: "Email address is required",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Invalid email address"
                        }
                      })}
                      errors={errors?.email}
                    />
                  </div>
                  <div className="my-8 px-12">
                    <label htmlFor="amount">Wallet Principal</label>
                    <InputField
                      id="principal"
                      type="text"
                      register={register("principal", {
                        validate: {
                          isValidRecipientAddress: (v) =>
                            isValidRecipientAddress(v) ||
                            "Invalid recipient address.",
                        },
                      })}
                      errors={errors?.principal}
                    />
                  </div>
                  <div className="my-8 px-12">
                    <label htmlFor="amount">Description</label>
                    <InputField
                      id="description"
                      type="text"
                      register={register("description", {
                        required: "Please describe your issue",
                      })}
                      errors={errors?.description}
                    />
                  </div>
                  <div className="text-center mt-4 mb-8 px-12">
                    <Button type="submit" className="w-full" disabled={!isValid && isPending}>
                      Submit
                    </Button>
                  </div>
                </form>
                </>
              )
            }
          </Card>
        </section>
      </div>
    </div>
  )
}

export default Support;