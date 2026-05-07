import { useWallet } from "@components/auth/useWallet";
import {
  Card,
  NewTable,
  SkeletonOverlay,
  ExpandedDetailsPanel,
  RowExpandToggle,
} from "@components/ui";
import { NewTableColumn } from "@components/ui/NewTable";
import { CardErrorOverlay } from "@components/dashboard";
import { buildFakeRows } from "@helpers/skeleton/fakeData";
import useNeurons from "@hooks/neurons/useNeuronsOwner";
import {
  AddNeuronProvider,
  BtnAddNeuron,
  DialogAddNeuron,
  useAddNeuron,
} from "./add-neuron";
import {
  ClaimRewardProvider,
  BtnClaimReward,
  DialogClaimReward,
} from "./claim-reward";
import {
  RemoveNeuronProvider,
  BtnRemoveNeuron,
  DialogRemoveNeuron,
} from "./remove-neuron";

type AccountNeuronRow = {
  id: string;
  stakedAmount: string;
  claimAmount: number;
  tableAccountDetails: { id: string; label: string; value: string }[];
};

const columns: NewTableColumn<AccountNeuronRow>[] = [
  {
    id: "id",
    header: "ID",
    cell: (row, { isExpanded, toggleExpand }) => (
      <div className="flex items-center">
        <RowExpandToggle
          isExpanded={isExpanded}
          onToggle={toggleExpand}
          className="mr-2"
        />
        <span className="truncate min-w-0 max-w-[200px]">{row.id}</span>
      </div>
    ),
  },
  {
    id: "stakedAmount",
    header: "Staked amount",
    cell: (row) => <span>{row.stakedAmount} OGY</span>,
  },
  {
    id: "claimAmount",
    header: "Claim amount",
    cell: (row) => (
      <ClaimRewardProvider neuronId={row.id} claimAmount={row.claimAmount}>
        <BtnClaimReward />
        <DialogClaimReward />
      </ClaimRewardProvider>
    ),
  },
  {
    id: "removeNeuron",
    header: "",
    cell: () => (
      <RemoveNeuronProvider>
        <BtnRemoveNeuron />
        <DialogRemoveNeuron />
      </RemoveNeuronProvider>
    ),
  },
];

const FAKE_ROW: AccountNeuronRow = {
  id: "aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaaaa",
  stakedAmount: "1,000,000",
  claimAmount: 0,
  tableAccountDetails: [],
};

const buildSkeletonRows = (count: number): AccountNeuronRow[] =>
  buildFakeRows(FAKE_ROW, count).map((row, index) => ({
    ...row,
    id: `${row.id}-${index}`,
  }));

const NeuronsEmptyState = () => {
  const { handleShow } = useAddNeuron();
  return (
    <div className="flex flex-col items-center gap-4 text-center py-10 px-6 rounded-[20px] border border-dashed border-border bg-surface-1">
      <div className="flex flex-col gap-1">
        <h4 className="text-content text-base font-semibold">No neurons yet</h4>
        <p className="text-sm text-muted max-w-[340px]">
          Add an OGY neuron to start tracking stake, voting power, and rewards
          here.
        </p>
      </div>
      <button
        type="button"
        onClick={handleShow}
        className="text-[13px] font-medium text-content hover:underline"
      >
        Add your first neuron
      </button>
    </div>
  );
};

const NeuronsList = () => {
  const { principalId: owner } = useWallet();
  const { neuronsList, isSuccess, isLoading, isError } = useNeurons({
    owner,
    limit: 0,
  });

  const hasError = !isLoading && isError;
  const showSkeleton = isLoading || hasError;
  const realRows = (neuronsList?.rows ?? []) as AccountNeuronRow[];
  const isEmpty = isSuccess && !hasError && realRows.length === 0;
  const rows =
    showSkeleton || !isSuccess ? buildSkeletonRows(3) : realRows;

  return (
    <SkeletonOverlay loading={showSkeleton}>
      <Card className="!rounded-2xl !border-border-strong">
        <AddNeuronProvider>
          {hasError && <CardErrorOverlay title="My OGY Neurons" />}
          <div data-skel-static className="flex items-center mb-8 gap-4">
            <div className="text-content text-[22px] font-semibold leading-none">
              My OGY Neurons
            </div>
            <BtnAddNeuron />
          </div>
          {isEmpty ? (
            <NeuronsEmptyState />
          ) : (
            <NewTable
              columns={columns}
              data={rows}
              getRowId={(row) => row.id}
              renderExpanded={(row) => (
                <ExpandedDetailsPanel
                  details={row.tableAccountDetails}
                  columns={4}
                />
              )}
            />
          )}
          <DialogAddNeuron />
        </AddNeuronProvider>
      </Card>
    </SkeletonOverlay>
  );
};

export default NeuronsList;
