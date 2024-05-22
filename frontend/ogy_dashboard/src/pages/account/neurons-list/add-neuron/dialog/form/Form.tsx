import { FormEvent } from "react";
import { Link } from "react-router-dom";
import type { FieldApi } from "@tanstack/react-form";
import useConnect from "@hooks/useConnect";
import { Button } from "@components/ui";
import CopyToClipboard from "@components/buttons/CopyToClipboard";
import { NNS_PLATFORM_URL } from "@constants/index";
import { useAddNeuron } from "../../context";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FieldInfo = ({ field }: { field: FieldApi<any, any, any, any> }) => {
  return (
    <>
      {field.state.meta.touchedErrors ? (
        <em>{field.state.meta.touchedErrors}</em>
      ) : null}
    </>
  );
};

const Form = () => {
  const { principal } = useConnect();
  const { form } = useAddNeuron();
  const { Field, Subscribe, handleSubmit } = form;

  const handleOnSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    handleSubmit();
  };
  return (
    <>
      <div>
        To successfully add each neuron to the dashboard, please complete the
        following two steps for every individual neuron:
      </div>
      <div className="mt-4">
        1. Add your principal{" "}
        <span className="font-semibold">
          <span>{principal}</span>
          <span>
            <CopyToClipboard value={principal as string} />
          </span>
        </span>
        as a HotKey to your OGY neuron which you wish to include in this
        dashboard. To do this, Open your{" "}
        <span>
          <Link
            to={NNS_PLATFORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent font-semibold"
          >
            NNS app
          </Link>
        </span>{" "}
        and click into each Neuron.
      </div>
      <div className="mt-4 mb-2">2. Enter your OGY neuron ID here:</div>
      <form onSubmit={(e) => handleOnSubmit(e)}>
        <Field
          name="neuronId"
          validators={{
            onChange: ({ value }) =>
              !value
                ? "neuronId is required"
                : value.length < 3
                ? "First name must be at least 3 characters"
                : undefined,
            onChangeAsyncDebounceMs: 500,
            onChangeAsync: async ({ value }) => {
              await new Promise((resolve) => setTimeout(resolve, 1000));
              return (
                value.includes("error") && 'No "error" allowed in first name'
              );
            },
          }}
          children={(field) => {
            return (
              <>
                <input
                  id={field.name}
                  placeholder={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="form-input px-4 py-3 mt-2 bg-surface border border-border rounded-full w-full outline-none focus:outline-none focus:border-border focus:ring-0"
                />
                <FieldInfo field={field} />
              </>
            );
          }}
        />
        <Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit} className="mt-4 w-full">
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="ml-4 border-4 border-accent/20 border-t-accent h-6 w-6 animate-spin rounded-full" />
                </div>
              ) : (
                "Confirm"
              )}
            </Button>
          )}
        />
      </form>
    </>
  );
};

export default Form;
