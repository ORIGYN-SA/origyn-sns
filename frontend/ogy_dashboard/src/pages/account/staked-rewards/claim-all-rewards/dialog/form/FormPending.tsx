import { LoaderSpin } from "@components/ui";

const FormPending = () => {
  return (
    <div className="flex flex-col items-center">
      <div className="mb-4">Claiming all rewards...</div>
      <LoaderSpin />
    </div>
  );
};

export default FormPending;
