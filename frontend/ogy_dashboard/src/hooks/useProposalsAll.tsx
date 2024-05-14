import { useQuery, keepPreviousData } from "@tanstack/react-query";
import useConnect from "@hooks/useConnect";
import { getListProposalsAll } from "@services/queries/governance/getListProposalsAll";

const useProposalsAll = ({
  limit = 10,
  offset = 0,
}: {
  limit: number;
  offset: number;
}) => {
  const { isConnected } = useConnect();

  const {
    data: proposals,
    isSuccess: isSuccessListProposals,
    isError: isErrorListProposals,
    isLoading: isLoadingListProposals,
    error: errorListProposals,
  } = useQuery({
    queryKey: ["listProposalsAll", limit, offset, isConnected],
    queryFn: () =>
      getListProposalsAll({
        limit,
        offset,
      }),
    enabled: !!isConnected,
    placeholderData: keepPreviousData,
  });

  const isSuccess = isSuccessListProposals;

  const rows = isSuccess
    ? proposals.data?.map((proposal) => {
        const id = proposal.id;
        const proposer = proposal.proposer;
        const proposed = proposal.proposed;
        const title = proposal.title;
        const timeRemaining = proposal.timeRemaining;
        const topic = proposal.topic;
        const status = proposal.status;
        return {
          id,
          proposer,
          proposed,
          title,
          timeRemaining,
          topic,
          status,
          details: [{ label: "Proposer", value: proposer }],
        };
      })
    : [];

  return {
    data: {
      list: {
        rows,
        pageCount: proposals?.totalProposals
          ? Math.ceil(proposals?.totalProposals / limit)
          : 0,
        rowCount: proposals?.totalProposals ?? 0,
      },
    },
    isLoading: isLoadingListProposals,
    isSuccess,
    isError: isErrorListProposals,
    error: errorListProposals,
  };
};

export default useProposalsAll;
