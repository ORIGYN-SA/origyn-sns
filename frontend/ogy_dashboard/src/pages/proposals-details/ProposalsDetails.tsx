import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import { Card, LoaderSpin, Badge } from "@components/ui";
import useProposal from "@hooks/useProposal";
import { getColorByProposalStatus } from "@helpers/colors/getColorByProposalStatus";

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
            <Card>
              <div className="flex items-center justify-between">
                <Badge
                  className={`bg-${getColorByProposalStatus(
                    proposal.status as string
                  )}/20 py-2 px-2`}
                >
                  <div
                    className={`text-${getColorByProposalStatus(
                      proposal.status as string
                    )} text-xs font-semibold shrink-0`}
                  >
                    {proposal.status}
                  </div>
                </Badge>

                <div className="text-content/60 text-sm font-semibold">
                  Posted {proposal.proposed}
                </div>
              </div>
              <div className="mt-5">
                <h3 className="text-2xl leading-6 font-semibold">
                  Proposal ID: {proposal.id}
                </h3>
              </div>
              <div className="mt-6">
                <h3 className="mb-2 text-content/60 font-semibold">
                  More info:
                </h3>
                <div className="rounded-xl bg-surface-2/40 p-8">
                  <pre className="whitespace-pre-wrap break-all text-sm">
                    {proposal.payload}
                  </pre>
                </div>
              </div>
              <div className="flex items-center mt-12">
                <div className="text-content/60 font-semibold mr-2">Topic:</div>
                <Badge className={`bg-spacePurple/20 py-2 px-2`}>
                  <div
                    className={`text-spacePurple text-xs font-semibold shrink-0`}
                  >
                    {proposal.topic}
                  </div>
                </Badge>
              </div>
            </Card>

            <Card className="block xl:hidden">
              <div className="pt-5 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Proposals status
                </h3>
              </div>
              <div className="mt-6">
                <h3 className="text-base font-medium text-gray-900">Votes:</h3>
              </div>
            </Card>

            {/* <Card className="">
              <div className="pt-5 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Payload: Proposal to transfer SNS Treasury funds:
                </h3>
              </div>
              <div className="mt-6">
                <h3 className="text-base font-medium text-gray-900">
                  Source treasury: SNS Token Treasury (SNS Ledger)
                </h3>
              </div>
            </Card> */}

            {/* <Card className="">
              <div className="pt-5 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  My Voting History
                </h3>
              </div>
              <div className="mt-6"></div>
            </Card> */}
          </div>

          <Card className="hidden xl:block">
            <div className="pt-5 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Proposals status
              </h3>
            </div>
            <div className="mt-6">
              <h3 className="text-base font-medium text-gray-900">Votes:</h3>
            </div>
          </Card>
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
