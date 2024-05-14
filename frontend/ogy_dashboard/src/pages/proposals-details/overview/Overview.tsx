import { Card, Badge } from "@components/ui";
import { IProposalData } from "@services/types";
import { getColorByProposalStatus } from "@helpers/colors/getColorByProposalStatus";

const Overview = ({ proposal }: { proposal: IProposalData }) => {
  const { id, status, proposed, payload, topic } = proposal;
  return (
    <Card>
      <div className="flex items-center justify-between">
        <Badge
          className={`bg-${getColorByProposalStatus(
            status as string
          )}/20 py-2 px-2`}
        >
          <div
            className={`text-${getColorByProposalStatus(
              status
            )} text-xs font-semibold shrink-0`}
          >
            {status}
          </div>
        </Badge>

        <div className="text-content/60 text-sm font-semibold">
          Posted {proposed}
        </div>
      </div>
      <div className="mt-5">
        <h3 className="text-2xl leading-6 font-semibold">Proposal ID: {id}</h3>
      </div>
      <div className="mt-6">
        <h3 className="mb-2 text-content/60 font-semibold">More info:</h3>
        <div className="rounded-xl bg-surface-2/40 p-8">
          <pre className="whitespace-pre-wrap break-all text-sm">{payload}</pre>
        </div>
      </div>
      <div className="flex items-center mt-12">
        <div className="text-content/60 font-semibold mr-2">Topic:</div>
        <Badge className={`bg-spacePurple/20 py-2 px-2`}>
          <div className={`text-spacePurple text-xs font-semibold shrink-0`}>
            {topic}
          </div>
        </Badge>
      </div>
    </Card>
  );
};

export default Overview;
