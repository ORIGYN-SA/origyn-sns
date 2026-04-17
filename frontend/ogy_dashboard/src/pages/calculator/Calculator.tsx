import { ChangeEvent, ReactNode, useDeferredValue, useMemo, useState } from "react";
import clsx from "clsx";
import { Card, SkeletonOverlay } from "@components/ui";
import { CardHeader, StatCard } from "@components/dashboard";
import { FAKE_STAT_VALUE } from "@helpers/skeleton/fakeData";
import { millify } from "@helpers/numbers";
import { useMintCostEstimate } from "../../hooks/calculator/useMintCostEstimate";

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

const ASSET_QUALITY_OPTIONS: {
  value: AssetQuality;
  label: string;
  hint: string;
}[] = [
  { value: "pdf", label: "PDF", hint: "250 KB each" },
  { value: "iphone", label: "Photo", hint: "3 MB each" },
  { value: "dslr", label: "Studio photo", hint: "20 MB each" },
  { value: "video", label: "Short video", hint: "1 GB each" },
  { value: "video1hr", label: "Long video", hint: "60 GB each" },
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

const groupDigits = (value: string) => value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

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
  return (whole * scale + BigInt(fractionPart)) * unitBytes / scale;
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

const formatBytes = (bytes: bigint) => {
  if (bytes === 0n) return "0 bytes";
  if (bytes < KB_SCALE) return `${formatInteger(bytes)} bytes`;
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
        trailing ? "pl-4 pr-1" : "px-4",
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
          onChange(allowDecimal ? sanitizeDecimal(e.target.value) : sanitizeInteger(e.target.value))
        }
      />
      {trailing}
    </div>
    {helper && <p className="mt-2 text-xs text-muted">{helper}</p>}
  </div>
);

const HeroOgyStat = ({
  value,
  loading,
}: {
  value?: string;
  loading?: boolean;
}) => {
  const displayValue = loading && value == null ? FAKE_STAT_VALUE : value;
  return (
    <div className="flex items-baseline min-w-0">
      <img
        src="/ogy_logo.svg"
        alt=""
        className="mr-3 h-10 w-10 shrink-0 self-center sm:h-12 sm:w-12"
      />
      <span className="font-bold text-[44px] leading-none text-content truncate min-w-0 sm:text-[56px]">
        {displayValue}
      </span>
      <span className="ml-3 font-semibold text-[20px] leading-none text-muted shrink-0 sm:text-[24px]">
        OGY
      </span>
    </div>
  );
};

const MiniStat = ({ title, value }: { title: string; value: string }) => (
  <div className="rounded-xl border border-border bg-surface-2/40 px-4 py-3 dark:bg-surface-2">
    <p className="text-xs font-medium leading-none text-muted">{title}</p>
    <p className="mt-2 text-base font-bold leading-none text-content">{value}</p>
  </div>
);

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) => (
  <div className="flex items-center justify-between gap-4 py-3">
    <span className="text-sm text-muted">{label}</span>
    <div className="shrink-0 text-right text-sm text-content">{value}</div>
  </div>
);

const Calculator = () => {
  const [mode, setMode] = useState<SizeMode>("preset");
  const [assetQuality, setAssetQuality] = useState<AssetQuality>("pdf");
  const [customUnit, setCustomUnit] = useState<SizeUnit>("MB");
  const [inputs, setInputs] = useState<Inputs>({
    numMints: "",
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
    () => parseDecimalBytes(deferredCustomSizeInput, SIZE_UNIT_BYTES[customUnit]),
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
  } = useMintCostEstimate(estimateArgs);

  const estimateError = error instanceof Error ? error.message : null;

  const showSkeleton = isLoading && !estimate;
  const showError = !showSkeleton && !!estimateError && !estimate;

  return (
    <div className="max-w-[1440px] mx-auto py-16 px-6">
      <div className="flex flex-col items-center">
        <div className="flex flex-col items-center gap-2 px-16 py-8 max-w-[528px]">
          <h1 className="font-extrabold text-[64px] leading-[60px] tracking-[-0.05em] text-center text-content">
            Cost calculator
          </h1>
          <p className="font-light text-[22px] leading-none text-center text-muted">
            See what it costs to mint before you commit.
          </p>
        </div>

        <div className="mt-8 w-full max-w-6xl">
          <Card>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-0">
              <section className="lg:pr-8">
                <CardHeader
                  title="Plan your mint"
                  subtitle={
                    <p className="text-sm text-muted">
                      Tell us how many items and what you&apos;re uploading.
                    </p>
                  }
                />

                <div className="mt-6 flex flex-col gap-6">
                  <NumberInput
                    label="How many items?"
                    value={inputs.numMints}
                    onChange={(value) =>
                      setInputs((prev) => ({ ...prev, numMints: value }))
                    }
                  />

                  {mode === "preset" ? (
                    <div className="flex min-h-[232px] flex-col gap-3 sm:min-h-[168px]">
                      <div className="flex items-center justify-between gap-4">
                        <label className="text-sm font-medium text-content">
                          What are you uploading?
                        </label>
                        <button
                          type="button"
                          onClick={() => setMode("custom")}
                          className="text-xs font-medium text-muted underline underline-offset-2 hover:text-content"
                        >
                          Know the exact size?
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {ASSET_QUALITY_OPTIONS.map((option) => {
                          const active = assetQuality === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              aria-pressed={active}
                              onClick={() => setAssetQuality(option.value)}
                              className={clsx(
                                "flex flex-col items-start gap-1 rounded-xl border px-3 py-3 text-left transition-colors",
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
                          Total upload size
                        </label>
                        <button
                          type="button"
                          onClick={() => setMode("preset")}
                          className="text-xs font-medium text-muted underline underline-offset-2 hover:text-content"
                        >
                          Use a preset instead
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
                          <div className="ml-2 flex h-10 shrink-0 items-center rounded-full bg-surface-faint p-0.5">
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
                        Combined size of every file across all items.
                      </p>
                    </div>
                  )}

                </div>
              </section>

              <section className="flex flex-col border-t border-border pt-8 lg:h-full lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                <CardHeader
                  title={isFetching && estimate ? "Refreshing estimate" : "Live estimate"}
                  subtitle={
                    <p className="text-sm text-muted">
                      Updates automatically as you change your setup.
                    </p>
                  }
                />

                <div className="mt-6 flex flex-1 flex-col gap-6">
                  <SkeletonOverlay loading={showSkeleton}>
                    {showError ? (
                      <div>
                        <p className="text-sm font-medium text-content">
                          Estimate unavailable
                        </p>
                        <p className="mt-2 text-sm text-red-500">
                          {estimateError}
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-6">
                        <HeroOgyStat
                          value={
                            estimate ? formatOgyCompact(estimate.total_ogy_e8s) : "0.00"
                          }
                          loading={showSkeleton}
                        />
                        {estimateError && estimate && (
                          <p className="text-sm text-red-500">{estimateError}</p>
                        )}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <StatCard
                            title="USD equivalent"
                            value={
                              estimate
                                ? formatUsdCompact(estimate.total_usd_e8s)
                                : "$0.00"
                            }
                            loading={showSkeleton}
                          />
                          <StatCard
                            title="OGY spot rate"
                            value={
                              estimate
                                ? formatUsdRateFromE8s(estimate.ogy_usd_price_e8s)
                                : "$0.0000"
                            }
                            loading={showSkeleton}
                          />
                        </div>
                      </div>
                    )}
                  </SkeletonOverlay>
                  {numMints !== null &&
                    numMints > 0n &&
                    totalFileSizeBytes > 0n && (
                      <div className="mt-auto grid grid-cols-2 gap-3 pt-2">
                        <MiniStat
                          title={numMints === 1n ? "Item" : "Items"}
                          value={formatCount(numMints)}
                        />
                        <MiniStat
                          title="Upload"
                          value={formatBytes(totalFileSizeBytes)}
                        />
                      </div>
                    )}
                </div>
              </section>
            </div>

            <div className="mt-8 border-t border-border pt-6">
              <h3 className="font-semibold text-[16px] leading-none text-muted">
                Cost breakdown
              </h3>
              <div className="mt-2 grid grid-cols-1 gap-x-8 md:grid-cols-2">
                <div className="divide-y divide-border">
                  <DetailRow
                    label="Base mint fee"
                    value={
                      estimate
                        ? formatUsdCompact(estimate.breakdown.base_fee_usd_e8s)
                        : "$0.00"
                    }
                  />
                  <DetailRow
                    label="Storage fee"
                    value={
                      estimate
                        ? formatUsdCompact(estimate.breakdown.storage_fee_usd_e8s)
                        : "$0.00"
                    }
                  />
                </div>
                <div className="divide-y divide-border border-t border-border md:border-t-0">
                  <DetailRow
                    label="Items"
                    value={formatCount(numMints ?? 0n)}
                  />
                  <DetailRow
                    label="Upload size"
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
