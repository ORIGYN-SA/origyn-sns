import {
  ChangeEvent,
  ReactNode,
  useDeferredValue,
  useMemo,
  useState,
} from "react";
import clsx from "clsx";
import Card from "../ui/Card";
import SkeletonOverlay from "../ui/SkeletonOverlay";
import StatCard from "../ui/StatCard";
import CardErrorOverlay from "../ui/CardErrorOverlay";
import { FAKE_STAT_VALUE, millify } from "../lib/format";
import { FONT_FAMILY } from "../lib/fonts";
import { useMintCostEstimate } from "./hooks/useMintCostEstimate";

type AssetQuality = "pdf" | "iphone" | "dslr" | "video" | "video1hr";
type SizeUnit = "KB" | "MB" | "GB";
type SizeMode = "preset" | "custom";

type Inputs = {
  numMints: string;
  customSize: string;
};

const ASSET_QUALITY_BYTES: Record<AssetQuality, bigint> = {
  pdf: 250_000n,
  iphone: 3_000_000n,
  dslr: 20_000_000n,
  video: 1_000_000_000n,
  video1hr: 60_000_000_000n,
};

const ASSET_QUALITY_ORDER: AssetQuality[] = [
  "pdf",
  "iphone",
  "dslr",
  "video",
  "video1hr",
];

const SIZE_UNIT_BYTES: Record<SizeUnit, bigint> = {
  KB: 1_000n,
  MB: 1_000_000n,
  GB: 1_000_000_000n,
};

const SIZE_UNITS: SizeUnit[] = ["KB", "MB", "GB"];

const E8S_SCALE = 100_000_000n;
const KB_SCALE = 1_000n;
const MB_SCALE = 1_000_000n;
const GB_SCALE = 1_000_000_000n;
const TB_SCALE = 1_000_000_000_000n;
const PB_SCALE = 1_000_000_000_000_000n;
const EB_SCALE = 1_000_000_000_000_000_000n;

const COMPACT_E8S_THRESHOLD = 1_000_000_000_000n;
const COMPACT_COUNT_THRESHOLD = 10_000n;

type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

/**
 * Translatable strings for the Calculator. Hosts pass a `messages` prop; any
 * field omitted falls back to the English defaults exported below.
 */
export type CalculatorMessages = {
  header: { title: string; description: string };
  plan: {
    title: string;
    description: string;
    itemsLabel: string;
    uploadingLabel: string;
    knowExactSize: string;
    totalUploadSize: string;
    usePreset: string;
    combinedSize: string;
    qualityOptions: Record<AssetQuality, { label: string; hint: string }>;
  };
  estimate: {
    titleLive: string;
    titleRefreshing: string;
    description: string;
    ogyEquivalent: string;
    ogySpotRate: string;
    itemSingular: string;
    itemPlural: string;
    upload: string;
  };
  breakdown: {
    title: string;
    baseFee: string;
    storageFee: string;
    items: string;
    uploadSize: string;
  };
  /** Lowercase "bytes" word. KB/MB/GB/... stay as international units. */
  bytesUnit: string;
};

export const DEFAULT_CALCULATOR_MESSAGES: CalculatorMessages = {
  header: {
    title: "Cost calculator",
    description:
      "Use the ORIGYN calculator to estimate the cost of your unique certificate with all your data on chain",
  },
  plan: {
    title: "Plan your mint",
    description: "Tell us how many items and what you're uploading.",
    itemsLabel: "How many items?",
    uploadingLabel: "What are you uploading?",
    knowExactSize: "Know the exact size?",
    totalUploadSize: "Total upload size",
    usePreset: "Use a preset instead",
    combinedSize: "Combined size of every file across all items.",
    qualityOptions: {
      pdf: { label: "PDF", hint: "250 KB each" },
      iphone: { label: "Photo", hint: "3 MB each" },
      dslr: { label: "Studio photo", hint: "20 MB each" },
      video: { label: "Short video", hint: "1 GB each" },
      video1hr: { label: "Long video", hint: "60 GB each" },
    },
  },
  estimate: {
    titleLive: "Live estimate",
    titleRefreshing: "Refreshing estimate",
    description: "Updates automatically as you change your setup.",
    ogyEquivalent: "OGY equivalent",
    ogySpotRate: "OGY spot rate",
    itemSingular: "Item",
    itemPlural: "Items",
    upload: "Upload",
  },
  breakdown: {
    title: "Cost breakdown",
    baseFee: "Base mint fee",
    storageFee: "Storage fee",
    items: "Items",
    uploadSize: "Upload size",
  },
  bytesUnit: "bytes",
};

// Section-level merge: each top-level subtree falls back to the default if the
// caller didn't override it. `qualityOptions` is merged per-key so a partial
// override (just one preset) still works.
const mergeMessages = (
  override?: DeepPartial<CalculatorMessages>,
): CalculatorMessages => {
  if (!override) return DEFAULT_CALCULATOR_MESSAGES;
  const d = DEFAULT_CALCULATOR_MESSAGES;
  return {
    header: { ...d.header, ...override.header },
    plan: {
      ...d.plan,
      ...override.plan,
      qualityOptions: {
        pdf: { ...d.plan.qualityOptions.pdf, ...override.plan?.qualityOptions?.pdf },
        iphone: { ...d.plan.qualityOptions.iphone, ...override.plan?.qualityOptions?.iphone },
        dslr: { ...d.plan.qualityOptions.dslr, ...override.plan?.qualityOptions?.dslr },
        video: { ...d.plan.qualityOptions.video, ...override.plan?.qualityOptions?.video },
        video1hr: { ...d.plan.qualityOptions.video1hr, ...override.plan?.qualityOptions?.video1hr },
      },
    },
    estimate: { ...d.estimate, ...override.estimate },
    breakdown: { ...d.breakdown, ...override.breakdown },
    bytesUnit: override.bytesUnit ?? d.bytesUnit,
  };
};

const groupDigits = (value: string) =>
  value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const parseWholeBigInt = (value: string) => {
  if (!value) return null;
  if (!/^\d+$/.test(value)) return null;

  try {
    return BigInt(value);
  } catch {
    return null;
  }
};

const parseDecimalBytes = (value: string, unitBytes: bigint): bigint | null => {
  if (!value) return null;
  if (!/^\d+(?:\.\d+)?$/.test(value)) return null;

  const [wholePart, fractionPart = ""] = value.split(".");
  const whole = BigInt(wholePart);

  if (!fractionPart) return whole * unitBytes;

  const scale = 10n ** BigInt(fractionPart.length);
  return ((whole * scale + BigInt(fractionPart)) * unitBytes) / scale;
};

const formatInteger = (value: bigint) => groupDigits(value.toString());

const formatQuotient = (
  value: bigint,
  divisor: bigint,
  fractionDigits: number
) => {
  const fractionScale = 10n ** BigInt(fractionDigits);
  const rounded = (value * fractionScale + divisor / 2n) / divisor;
  const whole = rounded / fractionScale;

  if (fractionDigits === 0) {
    return formatInteger(whole);
  }

  const fraction = (rounded % fractionScale)
    .toString()
    .padStart(fractionDigits, "0");

  return `${formatInteger(whole)}.${fraction}`;
};

const formatE8s = (value: bigint, fractionDigits: number) =>
  formatQuotient(value, E8S_SCALE, fractionDigits);

const formatUsdRateFromE8s = (value: bigint) => `$${formatE8s(value, 4)}`;

const makeFormatBytes = (bytesUnit: string) => (bytes: bigint) => {
  if (bytes === 0n) return `0 ${bytesUnit}`;
  if (bytes < KB_SCALE) return `${formatInteger(bytes)} ${bytesUnit}`;
  if (bytes < MB_SCALE) return `${formatQuotient(bytes, KB_SCALE, 2)} KB`;
  if (bytes < GB_SCALE) return `${formatQuotient(bytes, MB_SCALE, 2)} MB`;
  if (bytes < TB_SCALE) return `${formatQuotient(bytes, GB_SCALE, 2)} GB`;
  if (bytes < PB_SCALE) return `${formatQuotient(bytes, TB_SCALE, 2)} TB`;
  if (bytes < EB_SCALE) return `${formatQuotient(bytes, PB_SCALE, 2)} PB`;
  return `${formatQuotient(bytes, EB_SCALE, 2)} EB`;
};

const formatOgyCompact = (e8s: bigint) => {
  if (e8s < COMPACT_E8S_THRESHOLD) return formatE8s(e8s, 2);
  return millify(Number(e8s / E8S_SCALE), 3);
};

const formatUsdCompact = (e8s: bigint) => {
  if (e8s < COMPACT_E8S_THRESHOLD) return `$${formatE8s(e8s, 2)}`;
  return `$${millify(Number(e8s / E8S_SCALE), 3)}`;
};

const formatCount = (count: bigint) => {
  if (count < COMPACT_COUNT_THRESHOLD) return formatInteger(count);
  return millify(Number(count), 3);
};

const sanitizeInteger = (raw: string) => raw.replace(/[^\d]/g, "");

const sanitizeDecimal = (raw: string) => {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const [head, ...rest] = cleaned.split(".");
  return rest.length ? `${head}.${rest.join("")}` : head;
};

const NumberInput = ({
  label,
  value,
  onChange,
  trailing,
  helper,
  allowDecimal,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  trailing?: ReactNode;
  helper?: ReactNode;
  allowDecimal?: boolean;
}) => (
  <div>
    {label && (
      <label className="block text-sm font-medium text-content">{label}</label>
    )}
    <div
      className={clsx(
        "flex h-12 items-center rounded-full border border-border bg-surface focus-within:border-border-strong",
        // Logical padding so the trailing slot stays on the input's trailing
        // edge when the document flips to RTL.
        trailing ? "ps-4 pe-1" : "px-4",
        label && "mt-2"
      )}
    >
      <input
        type="text"
        inputMode={allowDecimal ? "decimal" : "numeric"}
        pattern={allowDecimal ? "[0-9.]*" : "[0-9]*"}
        className="h-full w-full border-0 bg-transparent p-0 text-content outline-none focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        value={value}
        placeholder="0"
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          onChange(
            allowDecimal
              ? sanitizeDecimal(e.target.value)
              : sanitizeInteger(e.target.value)
          )
        }
      />
      {trailing}
    </div>
    {helper && <p className="mt-2 text-xs text-muted">{helper}</p>}
  </div>
);

const HeroUsdStat = ({
  value,
  loading,
}: {
  value?: string;
  loading?: boolean;
}) => {
  const displayValue = loading && value == null ? FAKE_STAT_VALUE : value;
  return (
    <div className="flex items-baseline min-w-0">
      <span className="font-bold text-[44px] leading-none text-content truncate min-w-0 sm:text-[56px]">
        {displayValue}
      </span>
    </div>
  );
};

const MiniStat = ({ title, value }: { title: string; value: string }) => (
  <div className="rounded-xl border border-border bg-surface-2/40 px-4 py-3 dark:bg-surface-2">
    <p className="text-xs font-medium leading-none text-muted">{title}</p>
    <p className="mt-2 text-base font-bold leading-none text-content">
      {value}
    </p>
  </div>
);

const DetailRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="flex items-center justify-between gap-4 py-3">
    <span className="text-sm text-muted">{label}</span>
    <div className="shrink-0 text-end text-sm text-content">{value}</div>
  </div>
);

export type CalculatorProps = {
  /** Override the Minting Studio canister used for estimates. */
  canisterId?: string;
  /**
   * Render the built-in "Cost calculator" heading + description. Defaults to
   * true (standalone page). Set false when embedding under an existing heading
   * (e.g. the landing page's "Certify your assets" section).
   */
  showHeader?: boolean;
  /**
   * Translated strings. Partial — anything missing falls back to the English
   * defaults exported as `DEFAULT_CALCULATOR_MESSAGES`.
   */
  messages?: DeepPartial<CalculatorMessages>;
};

const Calculator = ({
  canisterId,
  showHeader = true,
  messages: messagesOverride,
}: CalculatorProps) => {
  const messages = useMemo(
    () => mergeMessages(messagesOverride),
    [messagesOverride],
  );
  const formatBytes = useMemo(
    () => makeFormatBytes(messages.bytesUnit),
    [messages.bytesUnit],
  );
  const assetQualityOptions = ASSET_QUALITY_ORDER.map((value) => ({
    value,
    ...messages.plan.qualityOptions[value],
  }));

  const [mode, setMode] = useState<SizeMode>("preset");
  const [assetQuality, setAssetQuality] = useState<AssetQuality>("pdf");
  const [customUnit, setCustomUnit] = useState<SizeUnit>("MB");
  const [inputs, setInputs] = useState<Inputs>({
    numMints: "1",
    customSize: "",
  });

  const numMints = useMemo(
    () => parseWholeBigInt(inputs.numMints),
    [inputs.numMints]
  );
  const customSizeBytes = useMemo(
    () => parseDecimalBytes(inputs.customSize, SIZE_UNIT_BYTES[customUnit]),
    [inputs.customSize, customUnit]
  );

  const presetTotalBytes = (numMints ?? 0n) * ASSET_QUALITY_BYTES[assetQuality];
  const totalFileSizeBytes =
    mode === "custom" ? (customSizeBytes ?? 0n) : presetTotalBytes;

  const deferredMode = useDeferredValue(mode);
  const deferredNumMintsInput = useDeferredValue(inputs.numMints);
  const deferredCustomSizeInput = useDeferredValue(inputs.customSize);
  const deferredNumMints = useMemo(
    () => parseWholeBigInt(deferredNumMintsInput),
    [deferredNumMintsInput]
  );
  const deferredCustomSizeBytes = useMemo(
    () =>
      parseDecimalBytes(deferredCustomSizeInput, SIZE_UNIT_BYTES[customUnit]),
    [deferredCustomSizeInput, customUnit]
  );
  const deferredTotalBytes =
    deferredMode === "custom"
      ? (deferredCustomSizeBytes ?? 0n)
      : (deferredNumMints ?? 0n) * ASSET_QUALITY_BYTES[assetQuality];

  const estimateArgs = useMemo(() => {
    if (
      deferredNumMints === null ||
      deferredNumMints <= 0n ||
      deferredTotalBytes <= 0n
    ) {
      return null;
    }

    return {
      numMints: deferredNumMints,
      totalFileSizeBytes: deferredTotalBytes,
    };
  }, [deferredNumMints, deferredTotalBytes]);

  const {
    data: estimate,
    error,
    isLoading,
    isFetching,
  } = useMintCostEstimate(estimateArgs, canisterId);

  const estimateError = error instanceof Error ? error.message : null;

  const showSkeleton = isLoading && !estimate;
  const showError = !showSkeleton && !!estimateError && !estimate;

  return (
    <div
      className={clsx(
        // w-full gives a definite width so the component fills its parent even
        // inside a flex container (where `mx-auto` would otherwise make a
        // flex item shrink to its content width instead of stretching).
        "w-full max-w-[1440px] mx-auto px-6 text-content",
        // The tall vertical padding is for the standalone page; when embedded
        // (header hidden) the host section provides its own spacing.
        showHeader && "py-8 sm:py-16"
      )}
      style={{ fontFamily: FONT_FAMILY }}
    >
      <div className="flex flex-col items-center">
        {showHeader && (
          <div className="flex flex-col items-center gap-2 px-6 py-6 max-w-[528px] sm:px-16 sm:py-8">
            <h1 className="font-extrabold text-[40px] leading-[44px] sm:text-[64px] sm:leading-[60px] tracking-[-0.05em] text-center text-content">
              {messages.header.title}
            </h1>
            <p className="font-light text-[16px] sm:text-[22px] leading-snug sm:leading-none text-center text-muted">
              {messages.header.description}
            </p>
          </div>
        )}

        <div className={clsx("w-full max-w-6xl", showHeader && "mt-8")}>
          <Card>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-0">
              <section className="lg:pe-8">
                <div className="flex flex-col gap-3">
                  <h2 className="text-[22px] font-semibold leading-none text-content">
                    {messages.plan.title}
                  </h2>
                  <p className="text-sm text-muted">{messages.plan.description}</p>
                </div>

                <div className="mt-6 flex flex-col gap-6">
                  <NumberInput
                    label={messages.plan.itemsLabel}
                    value={inputs.numMints}
                    onChange={(value) =>
                      setInputs((prev) => ({ ...prev, numMints: value }))
                    }
                  />

                  {mode === "preset" ? (
                    <div className="flex min-h-[232px] flex-col gap-3 sm:min-h-[168px]">
                      <div className="flex items-center justify-between gap-4">
                        <label className="text-sm font-medium text-content">
                          {messages.plan.uploadingLabel}
                        </label>
                        <button
                          type="button"
                          onClick={() => setMode("custom")}
                          className="text-xs font-medium text-muted underline underline-offset-2 hover:text-content"
                        >
                          {messages.plan.knowExactSize}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {assetQualityOptions.map((option) => {
                          const active = assetQuality === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              aria-pressed={active}
                              onClick={() => setAssetQuality(option.value)}
                              className={clsx(
                                "flex flex-col items-start gap-1 rounded-xl border px-3 py-3 text-start transition-colors",
                                active
                                  ? "border-content bg-content text-background"
                                  : "border-border-faint bg-surface-faint text-content hover:border-border-strong"
                              )}
                            >
                              <span className="text-sm font-semibold leading-none">
                                {option.label}
                              </span>
                              <span
                                className={clsx(
                                  "text-xs leading-none",
                                  active ? "opacity-70" : "text-muted"
                                )}
                              >
                                {option.hint}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-h-[232px] flex-col gap-3 sm:min-h-[168px]">
                      <div className="flex items-center justify-between gap-4">
                        <label className="text-sm font-medium text-content">
                          {messages.plan.totalUploadSize}
                        </label>
                        <button
                          type="button"
                          onClick={() => setMode("preset")}
                          className="text-xs font-medium text-muted underline underline-offset-2 hover:text-content"
                        >
                          {messages.plan.usePreset}
                        </button>
                      </div>
                      <NumberInput
                        label=""
                        allowDecimal
                        value={inputs.customSize}
                        onChange={(value) =>
                          setInputs((prev) => ({ ...prev, customSize: value }))
                        }
                        trailing={
                          <div className="ms-2 flex h-10 shrink-0 items-center rounded-full bg-surface-faint p-0.5">
                            {SIZE_UNITS.map((unit) => {
                              const active = customUnit === unit;
                              return (
                                <button
                                  key={unit}
                                  type="button"
                                  aria-pressed={active}
                                  onClick={() => setCustomUnit(unit)}
                                  className={clsx(
                                    "h-full rounded-full px-3 text-xs font-semibold transition-colors",
                                    active
                                      ? "bg-content text-background"
                                      : "text-muted hover:text-content"
                                  )}
                                >
                                  {unit}
                                </button>
                              );
                            })}
                          </div>
                        }
                      />
                      <p className="text-xs text-muted">
                        {messages.plan.combinedSize}
                      </p>
                    </div>
                  )}
                </div>
              </section>

              <section className="flex flex-col border-t border-border pt-8 lg:h-full lg:border-s lg:border-t-0 lg:ps-8 lg:pt-0">
                <div className="flex flex-col gap-3">
                  <h2 className="text-[22px] font-semibold leading-none text-content">
                    {isFetching && estimate
                      ? messages.estimate.titleRefreshing
                      : messages.estimate.titleLive}
                  </h2>
                  <p className="text-sm text-muted">
                    {messages.estimate.description}
                  </p>
                </div>

                <div className="mt-6 flex flex-1 flex-col gap-3">
                  <div className="relative">
                    <SkeletonOverlay loading={showSkeleton}>
                      <div className="flex flex-col gap-6">
                        <HeroUsdStat
                          value={
                            estimate
                              ? formatUsdCompact(estimate.total_usd_e8s)
                              : "$0.00"
                          }
                          loading={showSkeleton}
                        />
                        {estimateError && estimate && (
                          <p className="text-sm text-red-500">
                            {estimateError}
                          </p>
                        )}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <StatCard
                            title={messages.estimate.ogyEquivalent}
                            accessory={
                              <img
                                src="/ogy_logo.svg"
                                alt=""
                                className="h-5 w-5 shrink-0"
                              />
                            }
                            value={
                              estimate
                                ? formatOgyCompact(estimate.total_ogy_e8s)
                                : "0.00"
                            }
                            unit="OGY"
                            loading={showSkeleton}
                          />
                          <StatCard
                            title={messages.estimate.ogySpotRate}
                            value={
                              estimate
                                ? formatUsdRateFromE8s(
                                    estimate.ogy_usd_price_e8s
                                  )
                                : "$0.0000"
                            }
                            loading={showSkeleton}
                          />
                        </div>
                      </div>
                    </SkeletonOverlay>
                    {showError && (
                      <CardErrorOverlay title={messages.estimate.titleLive} />
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <MiniStat
                      title={
                        numMints === 1n
                          ? messages.estimate.itemSingular
                          : messages.estimate.itemPlural
                      }
                      value={formatCount(numMints ?? 0n)}
                    />
                    <MiniStat
                      title={messages.estimate.upload}
                      value={formatBytes(totalFileSizeBytes)}
                    />
                  </div>
                </div>
              </section>
            </div>

            <div className="mt-8 border-t border-border pt-6">
              <h3 className="font-semibold text-[16px] leading-none text-muted">
                {messages.breakdown.title}
              </h3>
              <div className="mt-2 grid grid-cols-1 gap-x-8 md:grid-cols-2">
                <div className="divide-y divide-border">
                  <DetailRow
                    label={messages.breakdown.baseFee}
                    value={
                      estimate
                        ? formatUsdCompact(estimate.breakdown.base_fee_usd_e8s)
                        : "$0.00"
                    }
                  />
                  <DetailRow
                    label={messages.breakdown.storageFee}
                    value={
                      estimate
                        ? formatUsdCompact(
                            estimate.breakdown.storage_fee_usd_e8s
                          )
                        : "$0.00"
                    }
                  />
                </div>
                <div className="divide-y divide-border border-t border-border md:border-t-0">
                  <DetailRow
                    label={messages.breakdown.items}
                    value={formatCount(numMints ?? 0n)}
                  />
                  <DetailRow
                    label={messages.breakdown.uploadSize}
                    value={formatBytes(totalFileSizeBytes)}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Calculator;
