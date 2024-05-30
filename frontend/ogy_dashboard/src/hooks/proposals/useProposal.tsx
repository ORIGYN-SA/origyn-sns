import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getOneProposal } from "@services/queries/governance/proposals/getOneProposal";

const useProposal = ({ proposalId }: { proposalId: string }) => {
  const {
    data: proposal,
    isSuccess: isSuccessGetOneProposal,
    isError: isErrorGetOneProposal,
    isLoading: isLoadingGetOneProposal,
    error: errorGetOneProposal,
  } = useQuery({
    queryKey: ["oneProposal", proposalId],
    queryFn: () =>
      getOneProposal({
        proposalId,
      }),
    placeholderData: keepPreviousData,
  });

  const id = proposal?.id;
  const proposer = proposal?.proposer;
  const proposed = proposal?.proposed;
  const title = proposal?.title;
  const timeRemaining = proposal?.timeRemaining;
  const topic = proposal?.topic;
  const status = proposal?.status;
  const payload = proposal?.payload;
  const votes = proposal?.votes;
  return {
    data: {
      id,
      proposer,
      proposed,
      title,
      timeRemaining,
      topic,
      status,
      payload,
      votes,
    },
    isLoading: isLoadingGetOneProposal,
    isSuccess: isSuccessGetOneProposal,
    isError: isErrorGetOneProposal,
    error: errorGetOneProposal,
  };
};

export default useProposal;
