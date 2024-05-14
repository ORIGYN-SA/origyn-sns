import { ReactNode } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import useConnect from "@hooks/useConnect";
import { getListProposalsAll } from "@services/queries/governance/proposals/getListProposalsAll";
import CopyToClipboard from "@components/buttons/CopyToClipboard";
import { Tooltip } from "@components/ui";

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
        const votes = proposal.votes;
        return {
          id,
          proposer,
          proposed,
          title,
          timeRemaining,
          topic,
          status,
          votes,
          details: [
            {
              label: "Proposer",
              value: (
                <div className="flex items-center justify-center max-w-sm m-auto">
                  <div
                    data-tooltip-id="tooltip_title"
                    data-tooltip-content={proposer}
                    className="truncate"
                  >
                    {proposer}
                  </div>
                  <Tooltip id="tooltip_title" />
                  <CopyToClipboard value={proposer} />
                </div>
              ) as ReactNode,
            },
            { label: "For votes", value: `${votes.yesToString} %` },
            { label: "Against votes", value: `${votes.noToString} %` },
          ],
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
