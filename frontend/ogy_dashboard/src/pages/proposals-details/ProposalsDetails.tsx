import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/20/solid";
import { PageHeader, Card, Button, SkeletonOverlay } from "@components/ui";
import { CardErrorOverlay, Stat } from "@components/dashboard";
import useProposal from "@hooks/proposals/useProposal";
import { getColorByProposalStatus } from "@helpers/colors/getColorByProposalStatus";
import ProgressBar from "@components/charts/progress-bar/ProgressBar";
import { NNS_PLATFORM_URL, SNS_ROOT_CANISTER } from "@constants/index";

const FAKE_TITLE = "Proposal title loading…";
const FAKE_PAYLOAD = "Loading proposal details…";

const getNnsProposalUrl = (proposalId: string) => {
  const { origin } = new URL(NNS_PLATFORM_URL);
  return `${origin}/proposal/?u=${SNS_ROOT_CANISTER}&proposal=${proposalId}`;
};

export const ProposalsDetails = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const proposalId = searchParams.get("id") as string;

  const { data: proposal, isLoading, isError } = useProposal({ proposalId });
  const hasError = !isLoading && isError;
  const showSkeleton = isLoading || hasError;

  const handleOnClickBack = () => navigate(-1);

  const status = proposal?.status ?? "Open";
  const yesPct = proposal?.votes?.yesToString ?? "0";
  const noPct = proposal?.votes?.noToString ?? "0";

  return (
    <div className="max-w-[1440px] mx-auto pt-8 pb-16 px-6">
      <PageHeader
        category="Governance"
        title={proposalId ? `Proposal #${proposalId}` : "Proposal"}
        onBack={handleOnClickBack}
      />

      <div className="relative mt-8">
        {hasError && (
          <CardErrorOverlay
            title={proposalId ? `Proposal #${proposalId}` : "Proposal"}
          />
        )}
        <SkeletonOverlay loading={showSkeleton}>
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
            <Card className="xl:col-span-3">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <span
                  className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${getColorByProposalStatus(status, "bg")} ${getColorByProposalStatus(status, "text")}`}
                >
                  {status}
                </span>
                <span className="text-sm text-muted">
                  Posted {proposal?.proposed ?? "…"}
                </span>
              </div>

              <h2 className="mt-6 text-2xl font-bold text-content break-words">
                {proposal?.title || FAKE_TITLE}
              </h2>

              <div className="mt-3 flex items-center gap-3 flex-wrap text-sm">
                <span className="text-muted">Topic</span>
                <span className="inline-block rounded-full border border-spacePurple/25 bg-spacePurple/10 px-3 py-1 text-xs font-semibold text-violet-700 dark:text-violet-300">
                  {proposal?.topic ?? "…"}
                </span>
              </div>

              <div className="mt-8 pt-6 border-t border-border">
                <div className="text-sm font-medium text-muted mb-3">
                  More info
                </div>
                <div className="rounded-xl bg-surface-2/40 p-6">
                  <pre className="overflow-x-auto whitespace-pre text-sm text-content">
                    {proposal?.payload || FAKE_PAYLOAD}
                  </pre>
                </div>
              </div>
            </Card>

            <Card className="xl:col-span-1 self-start flex flex-col gap-6">
              <div>
                <div className="text-sm font-medium text-muted mb-3">
                  Total votes
                </div>
                <Stat
                  iconSrc="/ogy_logo.svg"
                  value={proposal?.votes?.totalCompact}
                  unit="OGY"
                  loading={showSkeleton}
                />
              </div>

              <ProgressBar
                yesCount={proposal?.votes?.yes ?? 0}
                noCount={proposal?.votes?.no ?? 0}
              />

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircleIcon className="w-8 h-8 text-jade shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xl font-semibold text-content">
                      {yesPct}%
                    </div>
                    <div className="text-xs tracking-widest font-light text-muted">
                      ADOPT
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 min-w-0 justify-end">
                  <div className="min-w-0 text-right">
                    <div className="text-xl font-semibold text-content">
                      {noPct}%
                    </div>
                    <div className="text-xs tracking-widest font-light text-muted">
                      REJECT
                    </div>
                  </div>
                  <XCircleIcon className="w-8 h-8 text-red-400 shrink-0" />
                </div>
              </div>

              <a
                data-skel-static
                href={getNnsProposalUrl(proposalId)}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button className="w-full !px-[25px] !py-0 text-[14px] leading-[48px]">
                  <span className="inline-flex items-center justify-center gap-2">
                    Vote
                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                  </span>
                </Button>
              </a>
            </Card>
          </div>
        </SkeletonOverlay>
      </div>
    </div>
  );
};
