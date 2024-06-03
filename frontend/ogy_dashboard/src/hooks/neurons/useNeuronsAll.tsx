import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useCanister } from "@amerej/connect2ic-react";
import { getNervousSystemParameters } from "@services/queries/governance/neurons/useGetNervousSystemParameters";
import { getListNeuronsAll } from "@services/queries/governance/neurons/getListNeuronsAll";

const useNeuronsAll = ({
  limit = 10,
  offset = 0,
}: {
  limit: number;
  offset: number;
}) => {
  const [governanceActor] = useCanister("governance");

  const {
    data: nervousSystemParameters,
    isSuccess: isSuccessGetNervousSystemParameters,
    isError: isErrorGetNervousSystemParameters,
    isLoading: isLoadingGetNervousSystemParameters,
    error: errorGetNervousSystemParameters,
  } = useQuery({
    queryKey: ["getNervousSystemParameters"],
    queryFn: () => getNervousSystemParameters({ governanceActor }),
  });

  const {
    data: neurons,
    isSuccess: isSuccessListNeurons,
    isError: isErrorListNeurons,
    isLoading: isLoadingListNeurons,
    error: errorListNeurons,
  } = useQuery({
    queryKey: ["listNeuronsAll", limit, offset],
    queryFn: () =>
      getListNeuronsAll({
        limit,
        offset,
        nervousSystemParameters,
      }),
    enabled: !!isSuccessGetNervousSystemParameters,
    placeholderData: keepPreviousData,
  });

  const isSuccess = isSuccessGetNervousSystemParameters && isSuccessListNeurons;

  const rows = isSuccess
    ? neurons.data?.map((neuron) => {
        const id = neuron.id;
        const stakedAmount = neuron?.stakedAmountToString;
        const state = neuron?.state;
        const votingPower = neuron?.votingPowerToString;
        const dissolveDelay = neuron?.dissolveDelay;
        const age = neuron?.ageToRelativeCalendar;
        const stakedOGY = neuron?.stakedAmountToString;
        const stakedMaturity = neuron?.stakedMaturityToString;
        const createdAt = neuron?.createdAt;
        const ageBonus = neuron?.ageBonus;
        const maxAgeBonusPercentage = neuron?.maxAgeBonusPercentage;
        const dissolveDelayBonus = neuron?.dissolveDelayBonus;
        return {
          id,
          stakedAmount,
          state,
          votingPower,
          dissolveDelay,
          age,
          stakedOGY,
          stakedMaturity,
          createdAt,
          details: [
            { id: "", label: "Date Created", value: createdAt },
            {
              id: "",
              label: "Dissolve Delay Bonus",
              value: dissolveDelayBonus,
            },
            { id: "", label: "Age Bonus", value: ageBonus },
            { id: "", label: "Total Bonus", value: maxAgeBonusPercentage },
          ],
        };
      })
    : [];

  return {
    data: {
      list: {
        rows,
        pageCount: neurons?.totalNeurons
          ? Math.ceil(neurons?.totalNeurons / limit)
          : 0,
        rowCount: neurons?.totalNeurons ?? 0,
      },
    },
    isLoading: isLoadingListNeurons || isLoadingGetNervousSystemParameters,
    isSuccess,
    isError: isErrorListNeurons || isErrorGetNervousSystemParameters,
    error: errorListNeurons || errorGetNervousSystemParameters,
  };
};

export default useNeuronsAll;
