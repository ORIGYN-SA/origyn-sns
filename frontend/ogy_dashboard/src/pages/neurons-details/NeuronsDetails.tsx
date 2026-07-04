import { useNavigate, useSearchParams } from "react-router-dom";
import {
  PageHeader,
  Card,
  Badge,
  DetailRow,
  SkeletonOverlay,
} from "@components/ui";
import { CardErrorOverlay, Stat } from "@components/dashboard";
import useNeuron from "@hooks/neurons/useNeuron";
import { useT } from "@i18n/LocaleContext";

type DetailValue = string | number | null | undefined;

type DetailItem = {
  name: string;
  value: DetailValue;
};

// `name` is the lookup key matched against the neuron data; `labelKey` is the
// translation key used for the visible label.
const BONUS_DETAILS: { name: string; labelKey: string }[] = [
  { name: "Staked Maturity", labelKey: "neurons.details.stakedMaturity" },
  { name: "Total Maturity", labelKey: "neurons.details.totalMaturity" },
  { name: "Age Bonus", labelKey: "neurons.details.ageBonus" },
  { name: "Total Bonus", labelKey: "neurons.details.totalBonus" },
  {
    name: "Dissolve Delay Bonus",
    labelKey: "neurons.details.dissolveDelayBonus",
  },
];

// Drives the SkeletonOverlay so the layout matches the loaded state.
const PLACEHOLDER_DETAILS: DetailItem[] = [
  { name: "State", value: "Not dissolving" },
  { name: "Staked OGY", value: "1,000,000" },
  { name: "Voting Power", value: "1,250,000" },
  { name: "Dissolve Delay", value: "2 years" },
  { name: "Age", value: "6 months ago" },
  { name: "Date Created", value: "Jan 1, 2024" },
  { name: "Auto-Stake Maturity", value: "Enabled" },
  { name: "Staked Maturity", value: "100" },
  { name: "Total Maturity", value: "100" },
  { name: "Age Bonus", value: "10%" },
  { name: "Total Bonus", value: "25%" },
  { name: "Dissolve Delay Bonus", value: "100%" },
];

const formatDetailValue = (value: DetailValue) => {
  if (value === undefined || value === null || value === "") return "-";
  return value;
};

const getDetailValue = (details: DetailItem[], name: string) =>
  formatDetailValue(details.find((detail) => detail.name === name)?.value);

const getStateBadgeClasses = (state: DetailValue) =>
  state === "Dissolved"
    ? "border border-sky/25 bg-sky/10 text-sky-700 dark:text-sky-300"
    : "border border-jade/25 bg-jade/10 text-emerald-700 dark:text-emerald-300";

const DetailValueText = ({ value }: { value: DetailValue }) => (
  // Numeric/maturity/date values stay LTR so RTL bidi doesn't reorder them.
  <strong
    dir="ltr"
    className="inline-block text-base font-semibold text-content break-words"
  >
    {formatDetailValue(value)}
  </strong>
);

const SummaryTile = ({
  label,
  value,
}: {
  label: string;
  value: DetailValue;
}) => (
  <div className="rounded-xl bg-surface-2/40 p-5">
    <div data-skel-static className="text-sm font-medium text-muted">
      {label}
    </div>
    <div className="mt-3 text-2xl font-semibold text-content break-words">
      {/* Numeric stat (voting power / delay / age) stays LTR. */}
      <span dir="ltr" className="inline-block">
        {formatDetailValue(value)}
      </span>
    </div>
  </div>
);

export const NeuronsDetails = () => {
  const t = useT();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const neuronId = searchParams.get("id") ?? "";

  const {
    data: neuron,
    isLoading: isLoadingGetNeuron,
    isError: isErrorGetNeuron,
    isSuccess: isSuccessGetNeuron,
  } = useNeuron({ neuronId });

  const hasError = !isLoadingGetNeuron && isErrorGetNeuron;
  const showSkeleton = isLoadingGetNeuron || hasError;
  const details =
    showSkeleton || !isSuccessGetNeuron
      ? PLACEHOLDER_DETAILS
      : ((neuron?.details as DetailItem[] | undefined) ?? PLACEHOLDER_DETAILS);
  const state = getDetailValue(details, "State");

  const handleOnClickBack = () => {
    navigate(-1);
  };

  return (
    <div className="max-w-page mx-auto pt-8 pb-16 px-6">
      <PageHeader
        category={t("neurons.details.category")}
        categoryClassName="bg-candyFloss"
        title={t("neurons.details.title")}
        onBack={handleOnClickBack}
      />

      <div className="relative mt-8">
        <SkeletonOverlay loading={showSkeleton}>
          {hasError && (
            <CardErrorOverlay title={t("neurons.details.title")} />
          )}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
            <Card className="xl:col-span-3">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <Badge
                  className={`inline-flex text-xs font-semibold px-3 ${getStateBadgeClasses(
                    state
                  )}`}
                >
                  <span>{state}</span>
                </Badge>
                <span className="text-sm text-muted">
                  {t("neurons.details.created")}{" "}
                  {getDetailValue(details, "Date Created")}
                </span>
              </div>

              <div className="mt-8">
                <div
                  data-skel-static
                  className="text-sm font-medium text-muted mb-3"
                >
                  {t("neurons.details.stakedOgy")}
                </div>
                <Stat
                  iconSrc="/ogy_logo.svg"
                  value={getDetailValue(details, "Staked OGY")}
                  unit="OGY"
                  size="hero"
                  loading={showSkeleton}
                />
              </div>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-3">
                <SummaryTile
                  label={t("neurons.details.votingPower")}
                  value={getDetailValue(details, "Voting Power")}
                />
                <SummaryTile
                  label={t("neurons.details.dissolveDelay")}
                  value={getDetailValue(details, "Dissolve Delay")}
                />
                <SummaryTile
                  label={t("neurons.details.age")}
                  value={getDetailValue(details, "Age")}
                />
              </div>

              <div className="mt-8 pt-6 border-t border-border">
                <h2
                  data-skel-static
                  className="text-lg font-semibold text-content"
                >
                  {t("neurons.details.lifecycle")}
                </h2>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-x-6">
                  <DetailRow
                    label={t("neurons.details.dateCreated")}
                    value={
                      <DetailValueText
                        value={getDetailValue(details, "Date Created")}
                      />
                    }
                  />
                  <DetailRow
                    label={t("neurons.details.autoStakeMaturity")}
                    value={
                      <DetailValueText
                        value={getDetailValue(details, "Auto-Stake Maturity")}
                      />
                    }
                  />
                </div>
              </div>
            </Card>

            <Card className="xl:col-span-1 self-start">
              <div
                data-skel-static
                className="text-sm font-medium text-muted mb-3"
              >
                {t("neurons.details.rewardsAndBonuses")}
              </div>
              <div className="divide-y divide-border">
                {BONUS_DETAILS.map(({ name, labelKey }) => (
                  <DetailRow
                    key={name}
                    label={t(labelKey)}
                    value={
                      <DetailValueText value={getDetailValue(details, name)} />
                    }
                  />
                ))}
              </div>
            </Card>
          </div>
        </SkeletonOverlay>
      </div>
    </div>
  );
};
