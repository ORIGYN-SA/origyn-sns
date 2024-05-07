import { LoaderSpin } from "@components/ui";

const FormPending = () => {
  return (
    <div className="flex flex-col items-center">
      <div className="mb-4">Adding neuron...</div>
      <LoaderSpin />
    </div>
  );
};

export default FormPending;
