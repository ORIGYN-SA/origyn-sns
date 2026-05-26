import { ReactNode } from "react";
import { Button, InputField, Card, PageHeader } from "@components/ui";
import { Principal } from "@dfinity/principal";
import { SubmitHandler, useForm } from "react-hook-form";
import useCreateSupportTicket, {
  supportRequestProps,
} from "./useCreateSupportTicket";

const Field = ({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) => (
  <div className="flex flex-col gap-2">
    <label htmlFor={htmlFor} className="text-sm font-medium text-content">
      {label}
    </label>
    {children}
  </div>
);

const Support = () => {
  const mutation = useCreateSupportTicket();

  const {
    isSuccess,
    isPending,
    isError,
    error,
    reset: resetMutation,
  } = mutation;

  const isValidRecipientAddress = (value: string) => {
    try {
      Principal.fromText(value);
      return true;
    } catch {
      return false;
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<supportRequestProps>({
    mode: "onChange",
    shouldUnregister: true,
  });

  const onSubmit: SubmitHandler<supportRequestProps> = (data) => {
    mutation.mutate(data);
  };

  const handleCreateAnother = () => {
    reset();
    resetMutation();
  };

  return (
    <div className="max-w-[1440px] mx-auto pt-8 pb-16 px-6">
      <PageHeader
        category="Support"
        title={isSuccess ? "Ticket submitted" : "Create a ticket"}
      />

      <div className="flex justify-center mt-8">
        <Card className="w-full max-w-2xl">
          {isSuccess ? (
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-jade/15 text-jade">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M5 12.5L10 17.5L19 7.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="text-xl font-semibold text-content">
                Support ticket created
              </div>
              <p className="text-sm text-muted max-w-sm">
                We&apos;ll follow up at the email address you provided.
              </p>
              <Button
                onClick={handleCreateAnother}
                className="mt-2 !px-[25px] !py-0 text-[14px] leading-[48px]"
              >
                Submit another ticket
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted">
                Describe your issue and how we can reach you.
              </p>

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="mt-6 flex flex-col gap-4"
              >
                <Field label="Name" htmlFor="name">
                  <InputField
                    id="name"
                    type="text"
                    register={register("name")}
                    errors={errors?.name}
                  />
                </Field>

                <Field label="Contact email" htmlFor="email">
                  <InputField
                    id="email"
                    type="text"
                    register={register("email", {
                      required: "Email address is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    })}
                    errors={errors?.email}
                  />
                </Field>

                <Field label="Wallet principal" htmlFor="principal">
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
                </Field>

                <Field label="Description" htmlFor="description">
                  <textarea
                    id="description"
                    rows={5}
                    placeholder="Tell us what's going on…"
                    {...register("description", {
                      required: "Please describe your issue",
                    })}
                    className="form-input px-4 py-3 bg-surface border border-border rounded-[20px] w-full outline-none focus:outline-none focus:border-border focus:ring-0 resize-y"
                  />
                  {errors?.description && (
                    <p className="text-red-500 text-sm font-semibold">
                      {errors.description.message}
                    </p>
                  )}
                </Field>

                <div className="flex flex-col gap-2">
                  {isError && (
                    <p
                      role="alert"
                      className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400"
                    >
                      {error?.message ||
                        "Something went wrong. Please try again."}
                    </p>
                  )}

                  <Button
                    type="submit"
                    className="w-full !px-[25px] !py-0 text-[14px] leading-[48px]"
                    disabled={!isValid || isPending}
                  >
                    {isPending ? "Submitting…" : "Submit"}
                  </Button>
                </div>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Support;
