import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import { Card, LoaderSpin, Badge, Tooltip } from "@components/ui";
import CopyToClipboard from "@components/buttons/CopyToClipboard";
import useNeuron from "@hooks/neurons/useNeuron";

export const NeuronsDetails = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const {
    data: neuron,
    isSuccess: isSuccessGetNeuron,
    isLoading: isLoadingGetNeuron,
    isError: isErrorGetNeuron,
    error: errorGetNeuron,
  } = useNeuron({
    neuronId: searchParams.get("id") as string,
  });

  const handleOnClickBack = () => {
    navigate(-1);
  };

  return (
    <div className="container mx-auto py-16">
      <div className="flex flex-col xl:flex-row items-center xl:items-end justify-between mb-8">
        <div className="flex flex-col xl:flex-row xl:justify-center items-center gap-4 xl:gap-8">
          <ArrowLeftIcon
            className="h-8 w-8 hover:cursor-pointer"
            onClick={handleOnClickBack}
          />
          <div className="flex flex-col items-center xl:items-start">
            <div className="text-sm">Governance</div>
            <div className="text-3xl font-bold mb-4 xl:mb-0">OGY Neuron</div>
          </div>
        </div>
        <div className="flex ml-4 items-center truncate text-sm max-w-96 bg-surface-2 rounded-full py-2 px-4">
          <div className="mr-2 shrink-0 font-semibold">Neuron ID: </div>
          <div
            className="truncate"
            data-tooltip-id="tooltip"
            data-tooltip-content={searchParams.get("id")}
          >
            {searchParams.get("id")}
          </div>

          <CopyToClipboard value={searchParams.get("id") as string} />
        </div>
      </div>
      {isSuccessGetNeuron && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {neuron.details.map(({ name, value }) => (
            <Card className="bg-surface border border-border pb-8" key={name}>
              <div className="flex items-center text-lg">
                <span className="text-content/60">{name}</span>
              </div>
              {["State"].includes(name) ? (
                <div className="flex items-center mt-2">
                  <Badge
                    className={`${
                      value === "Dissolving" ? "bg-jade/20" : "bg-sky/20"
                    } px-2`}
                  >
                    <div
                      className={`${
                        value === "Dissolving" ? "text-jade" : "text-sky"
                      } text-xs font-semibold shrink-0`}
                    >
                      {value}
                    </div>
                  </Badge>
                </div>
              ) : (
                <div className="flex items-center mt-2 text-2xl font-semibold">
                  {value}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      {isLoadingGetNeuron && (
        <div className="flex items-center justify-center h-40">
          <LoaderSpin />
        </div>
      )}
      {isErrorGetNeuron && (
        <div className="flex items-center justify-center h-40 text-red-500 font-semibold">
          <div>{errorGetNeuron?.message}</div>
        </div>
      )}
      <Tooltip id="tooltip" />
    </div>
  );
};
