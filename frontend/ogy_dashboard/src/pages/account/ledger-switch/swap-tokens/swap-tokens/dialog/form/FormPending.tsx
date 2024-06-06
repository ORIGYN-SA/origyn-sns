import { LoaderSpin } from "@components/ui";

const FormPending = () => {
  return (
    <div className="flex flex-col items-center">
      <div className="w-full bg-orange-500 p-4 rounded-xl text-center">
        The swapping process can take a little time.
        <br />
        <span className="text-lg font-bold">Do not refresh the page !</span>
      </div>
      <div className="my-8 font-semibold">Swapping tokens...</div>
      <LoaderSpin />
    </div>
  );
};

export default FormPending;
