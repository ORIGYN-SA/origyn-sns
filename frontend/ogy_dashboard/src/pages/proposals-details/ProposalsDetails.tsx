// import { useMemo, Suspense } from "react";
import { defer, useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import { Card } from "@components/ui";

const loader = async () => {
  const dataProposals = new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { name: "State", value: "Dissolving" },
        { name: "Staked Maturity", value: 0 },
        { name: "Staked OGY", value: "5'424.1231817 OGY" },
        { name: "Dissolve Delay", value: "1 year, 365 days" },
        { name: "Total Maturity", value: 0 },
        { name: "Age", value: "13 days" },
        { name: "Date Created", value: "2024-03-14, 08:01:15 UTC" },
        { name: "Age Bonus", value: "-2.89%" },
        { name: "Total Bonus", value: "+101.78%" },
        { name: "Auto-Stake Maturity", value: "Yes" },
        { name: "Vesting Period", value: "None" },
        { name: "Dissolve Delay Bonus", value: "+100%" },
        { name: "Voting Power", value: "10^944.91" },
      ]);
    }, 300);
  });

  return defer({
    dataProposals: await dataProposals,
  });
};

export const ProposalsDetails = () => {
  const navigate = useNavigate();

  const handleOnClickBack = () => {
    navigate(-1);
  };

  // const data = useLoaderData();
  return (
    <div className="container mx-auto pt-8 pb-16">
      <div className="flex flex-col xl:flex-row items-center justify-between py-8">
        <div className="flex flex-col xl:flex-row xl:justify-center items-center gap-4 xl:gap-8">
          <ArrowLeftIcon
            className="h-8 w-8 hover:cursor-pointer"
            onClick={handleOnClickBack}
          />
          <div className="flex flex-col items-center xl:items-start">
            <div className="text-sm">Governance</div>
            <div className="text-3xl font-bold mb-4 xl:mb-0">Proposal</div>
          </div>
        </div>
        <div>Principal ID: 8329839839283982</div>
      </div>
      <div className="flex items-start justify-center gap-4">
        {/* Proposal Information Card */}

        <div className="flex flex-1 flex-col gap-4">
          <Card className="">
            <div className="pt-5 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Proposal ID: 1710947402604093042
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Posted Mar 20, 2024, 4:10 PM
              </p>
            </div>
            <div className="mt-6">
              <h3 className="text-base font-medium text-gray-900">
                More info:
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus
                pellentesque sit amet enim ut tincidunt. Cras et nibh aliquet,
                suscipit purus ut, egestas libero. Proin est magna, posuere a
                consequat nec, accumsan et erat. Nunc ut convallis tellus, in
                semper ex. Suspendisse ipsum enim, fringilla ut pellentesque ut,
                laoreet sed tortor.
              </p>
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
              {/* Content for proposals status */}
            </div>
          </Card>

          {/* Proposal Payload Card */}
          <Card className="">
            <div className="pt-5 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Payload: Proposal to transfer SNS Treasury funds:
              </h3>
            </div>
            <div className="mt-6">
              <h3 className="text-base font-medium text-gray-900">
                Source treasury: SNS Token Treasury (SNS Ledger)
              </h3>
              {/* Content for payload details */}
            </div>
          </Card>

          {/* My Voting History Card */}
          <Card className="">
            <div className="pt-5 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                My Voting History
              </h3>
            </div>
            <div className="mt-6">{/* Content for voting history */}</div>
          </Card>
        </div>

        <Card className="hidden xl:block">
          <div className="pt-5 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Proposals status
            </h3>
          </div>
          <div className="mt-6">
            <h3 className="text-base font-medium text-gray-900">Votes:</h3>
            {/* Content for proposals status */}
          </div>
        </Card>
      </div>
    </div>
  );
};

ProposalsDetails.loader = loader;
