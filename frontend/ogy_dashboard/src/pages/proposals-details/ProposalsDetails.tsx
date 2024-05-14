import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import { LoaderSpin, Badge } from "@components/ui";
import useProposal from "@hooks/proposals/useProposal";
import Overview from "./overview/Overview";
import Status from "./status/Status";
import { IProposalData, IProposalVotes } from "@services/types";

export const ProposalsDetails = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const {
    data: proposal,
    isSuccess: isSuccessGetProposal,
    isLoading: isLoadingGetProposal,
    isError: isErrorGetProposal,
    error: errorGetProposal,
  } = useProposal({
    proposalId: searchParams.get("id") as string,
  });

  const handleOnClickBack = () => {
    navigate(-1);
  };

  return (
    <div className="container mx-auto py-16 px-4">
      <div className="flex flex-col xl:flex-row items-center justify-between mb-8">
        <div className="flex flex-col xl:flex-row xl:justify-center items-center gap-4 xl:gap-8">
          <ArrowLeftIcon
            className="h-8 w-8 hover:cursor-pointer"
            onClick={handleOnClickBack}
          />
          <div className="flex flex-col items-center xl:items-start">
            <Badge className="bg-spacePurple px-4">
              <div className="text-white tracking-widest text-xs font-semibold uppercase">
                PROPOSALS
              </div>
            </Badge>
            <div className="text-3xl font-bold mb-4 xl:mb-0">Proposal</div>
          </div>
        </div>
        {/* <div>Principal ID: 8329839839283982</div> */}
      </div>
      {isSuccessGetProposal && (
        <div className="flex items-start justify-center gap-4">
          <div className="flex flex-1 flex-col gap-4">
            <Overview proposal={proposal as IProposalData} />
            <div className="block xl:hidden">
              <Status
                proposalId={searchParams.get("id") as string}
                votes={proposal.votes as IProposalVotes}
              />
            </div>
          </div>

          <div className="hidden xl:block w-3/12">
            <Status
              proposalId={searchParams.get("id") as string}
              votes={proposal.votes as IProposalVotes}
            />
          </div>
        </div>
      )}
      {isLoadingGetProposal && (
        <div className="flex items-center justify-center h-40">
          <LoaderSpin />
        </div>
      )}
      {isErrorGetProposal && (
        <div className="flex items-center justify-center h-40 text-red-500 font-semibold">
          <div>{errorGetProposal?.message}</div>
        </div>
      )}
    </div>
  );
};
