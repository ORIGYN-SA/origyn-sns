import { FormEvent } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "@amerej/artemis-react";
import { Button } from "@components/ui";
import CopyToClipboard from "@components/buttons/CopyToClipboard";
import { NNS_PLATFORM_URL } from "@constants/index";
import { useAddNeuron } from "../../context";

// eslint-disable-next-line @typescript-eslint/no-explicit-any

const Form = () => {
  const { principalId } = useWallet();
  const { form } = useAddNeuron();
  const { Subscribe, handleSubmit } = form;

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
        To successfully connect each neuron to the dashboard, you need to
        add your principal 
        </div>
        <div className="mt-6">
          <span className="font-semibold ml-1">
            <span>{principalId}</span>
            <span>
              <CopyToClipboard value={principalId as string} />
            </span>
          </span>
          as a HotKey to your OGY neuron which you wish to include in this
          dashboard.
          <br />
          To do this, open the{" "}
          <span>
            <Link
              to={NNS_PLATFORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent font-semibold"
            >
              NNS app
            </Link>
          </span>
          , click into each neuron and add your principal as a hotkey.
        </div>
      </div>

      <form onSubmit={(e) => handleOnSubmit(e)}>
        <Subscribe
          selector={(state) => [
            state.isSubmitting,
          ]}
          children={([isSubmitting]) => (
            <Button
              type="submit"
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
