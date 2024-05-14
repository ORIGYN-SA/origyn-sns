import { Link } from "react-router-dom";
import {
  HandThumbUpIcon,
  HandThumbDownIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { Card, Button } from "@components/ui";
import { IProposalVotes } from "@services/types";
import { NNS_PLATFORM_URL, SNS_ROOT_CANISTER } from "@constants/index";
import ProgressBar from "@components/charts/progress-bar/ProgressBar";

const Status = ({
  proposalId,
  votes,
}: {
  proposalId: string;
  votes: IProposalVotes;
}) => {
  const { yes, yesToString, no, noToString, total } = votes;
  return (
    <Card>
      <div>
        <h3 className="text-lg leading-6 font-semibold">Proposals status</h3>
      </div>
      <div className="rounded-xl border border-border p-4 mt-6">
        <div className="mb-4">
          <h3 className="text-base font-medium text-content/60">Votes</h3>
          <div className="text-2xl font-semibold">{total}</div>
        </div>
        <div>
          <ProgressBar yesCount={yes} noCount={no} />
        </div>
        <div className="flex justify-between items-center mt-8">
          <div className="flex items-center">
            <div className="bg-jade text-white rounded-full mr-2">
              <HandThumbUpIcon className="h-10 w-10 p-2" />
            </div>
            <div>
              <div className="text-xl font-semibold text-content/80">
                {yesToString} %
              </div>
              <div className="text-sm font-light tracking-widest text-content/60">
                ADOPT
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <div>
              <div className="text-xl font-semibold text-content/80">
                {noToString} %
              </div>
              <div className="text-sm font-light tracking-widest text-content/60 text-center">
                REJECT
              </div>
            </div>
            <div className="bg-red-400 text-white rounded-full ml-2">
              <HandThumbDownIcon className="h-10 w-10 p-2" />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8">
        <Link
          to={`${NNS_PLATFORM_URL}/proposal/?u=${SNS_ROOT_CANISTER}&proposal=${proposalId}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button className="w-full py-3">
            <div className="flex items-center justify-center">
              <div>Vote</div>
              <div>
                <ArrowTopRightOnSquareIcon className="ml-2 h-5 w-5 text-white font-semibold" />
              </div>
            </div>
          </Button>
        </Link>
      </div>
    </Card>
  );
};

export default Status;
