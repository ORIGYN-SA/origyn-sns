import { FormEvent } from "react";
import { Link } from "react-router-dom";
import type { FieldApi } from "@tanstack/react-form";
import { useWallet } from "@amerej/artemis-react";
import { Button } from "@components/ui";
import CopyToClipboard from "@components/buttons/CopyToClipboard";
import { NNS_PLATFORM_URL } from "@constants/index";
import { useAddNeuron } from "../../context";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FieldInfo = ({ field }: { field: FieldApi<any, any, any, any> }) => {
  return (
    <>
      {field.state.meta.touchedErrors ? (
        <em className="text-red-500 text-sm ml-4 font-semibold">
          {field.state.meta.touchedErrors}
        </em>
      ) : null}
    </>
  );
};

const Form = () => {
  const { principalId } = useWallet();
  const { form } = useAddNeuron();
  const { Field, Subscribe, handleSubmit } = form;

  const handleOnSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    handleSubmit();
  };
  return (
    <>
      <div className="text-center">
        <div className="mb-1 text-xl font-semibold">Add neuron</div>
        <div className="text-content/60">
          To successfully add each neuron to the dashboard, please complete the
          following two steps for every individual neuron
        </div>
        <div className="mt-6">
          <div className="text-content/60 font-semibold mb-2">Step 1</div>
          Add your principal{" "}
          <span className="font-semibold">
            <span>{principalId}</span>
            <span>
              <CopyToClipboard value={principalId as string} />
            </span>
          </span>
          as a HotKey to your OGY neuron which you wish to include in this
          dashboard.
          <br />
          To do this, open your{" "}
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
        <div className="text-content/60 font-semibold mt-6 mb-2">Step 2</div>
        <div className="mb-2">Enter your OGY neuron ID here:</div>
      </div>

      <form onSubmit={(e) => handleOnSubmit(e)}>
        <Field
          name="neuronId"
          validators={{
            onChange: ({ value }) =>
              !value ? "Neuron ID is required." : undefined,
            onChangeAsyncDebounceMs: 500,
            // onChangeAsync: async ({ value }) => {
            //   await new Promise((resolve) => setTimeout(resolve, 1000));
            //   return (
            //     value.includes("error") && 'No "error" allowed in first name'
            //   );
            // },
          }}
          children={(field) => {
            return (
              <div className="mt-4 mb-6">
                <input
                  id={field.name}
                  placeholder={"Neuron ID"}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="form-input px-4 py-3 mt-2 mb-1 bg-surface border border-border rounded-full w-full outline-none focus:outline-none focus:border-border focus:ring-0"
                />
                <FieldInfo field={field} />
              </div>
            );
          }}
        />
        <Subscribe
          selector={(state) => [
            state.canSubmit,
            state.isSubmitting,
            state.isTouched,
          ]}
          children={([canSubmit, isSubmitting, isTouched]) => (
            <Button
              type="submit"
              disabled={!canSubmit || !isTouched}
              className="mt-4 w-full"
            >
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
