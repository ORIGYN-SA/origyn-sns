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
import { useT } from "@i18n/LocaleContext";
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
  const t = useT();
  const { handleShow } = useAddNeuron();
  return (
    <div className="flex flex-col items-center gap-4 text-center py-10 px-6 rounded-[20px] border border-dashed border-border bg-surface-1">
      <div className="flex flex-col gap-1">
        <h4 className="text-content text-base font-semibold">
          {t("account.neurons.list.emptyTitle")}
        </h4>
        <p className="text-sm text-muted max-w-[340px]">
          {t("account.neurons.list.emptyDescription")}
        </p>
      </div>
      <button
        type="button"
        onClick={handleShow}
        className="text-[13px] font-medium text-content hover:underline"
      >
        {t("account.neurons.list.addFirstNeuron")}
      </button>
    </div>
  );
};

const NeuronsList = () => {
  const t = useT();
  const { principalId: owner } = useWallet();
  const { neuronsList, isSuccess, isLoading, isError } = useNeurons({
    owner,
    limit: 0,
  });

  const columns: NewTableColumn<AccountNeuronRow>[] = [
    {
      id: "id",
      header: t("account.neurons.list.idHeader"),
      cell: (row, { isExpanded, toggleExpand }) => (
        <div className="flex items-center">
          <RowExpandToggle
            isExpanded={isExpanded}
            onToggle={toggleExpand}
            className="me-2"
          />
          {/* Neuron ID is an inherently-LTR identifier. */}
          <span dir="ltr" className="truncate min-w-0 max-w-[200px] text-start">
            {row.id}
          </span>
        </div>
      ),
    },
    {
      id: "stakedAmount",
      header: t("account.neurons.list.stakedAmount"),
      cell: (row) => (
        <span dir="ltr" className="inline-block">
          {row.stakedAmount} OGY
        </span>
      ),
    },
    {
      id: "claimAmount",
      header: t("account.neurons.list.claimAmount"),
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

  const hasError = !isLoading && isError;
  const showSkeleton = isLoading || hasError;
  const realRows = (neuronsList?.rows ?? []) as AccountNeuronRow[];
  const isEmpty = isSuccess && !hasError && realRows.length === 0;
  const rows = showSkeleton || !isSuccess ? buildSkeletonRows(3) : realRows;

  return (
    <SkeletonOverlay loading={showSkeleton}>
      <Card className="!rounded-2xl !border-border-strong">
        <AddNeuronProvider>
          {hasError && (
            <CardErrorOverlay title={t("account.neurons.list.title")} />
          )}
          <div data-skel-static className="flex items-center mb-8 gap-4">
            <div className="text-content text-[22px] font-semibold leading-none">
              {t("account.neurons.list.title")}
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
