import { PointerEvent, useRef, useState } from "react";
import clsx from "clsx";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import { Card } from "@components/ui";
import { CardErrorOverlay } from "@components/dashboard";
import useEstimatedRewards from "@hooks/governance/useEstimatedRewards";
import { millify } from "@helpers/numbers";
import { useLocale } from "@i18n/LocaleContext";
import useFiveYearBooster from "@hooks/governance/useFiveYearBooster";
import { BOOSTER_HISTORY_ID } from "./BoosterHistory";

const COMPACT_AMOUNT_THRESHOLD = 10_000;

const formatAmountCompact = (formatted: string): string => {
  const n = Number(formatted.replace(/,/g, ""));
  if (!Number.isFinite(n) || n < COMPACT_AMOUNT_THRESHOLD) return formatted;
  return millify(n, 3);
};

interface EstimateRewardsProps {
  className?: string;
}

const THUMB_RADIUS = 15;

type DiscreteSliderProps = {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  ariaLabel?: string;
  className?: string;
};

const DiscreteSlider = ({
  min,
  max,
  value,
  onChange,
  ariaLabel,
  className,
}: DiscreteSliderProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const range = max - min;
  const pct = range === 0 ? 0 : ((value - min) / range) * 100;

  const setFromClientX = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const innerLeft = rect.left + THUMB_RADIUS;
    const innerWidth = rect.width - THUMB_RADIUS * 2;
    const raw = innerWidth <= 0 ? 0 : (clientX - innerLeft) / innerWidth;
    const clamped = Math.min(1, Math.max(0, raw));
    const next = Math.round(clamped * range) + min;
    if (next !== value) onChange(next);
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setFromClientX(e.clientX);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return;
    setFromClientX(e.clientX);
  };

  return (
    <div
      ref={ref}
      role="slider"
      // Range slider math/fill are left-based; keep it LTR so the track and
      // thumb don't desync from the pointer math under RTL locales.
      dir="ltr"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
          e.preventDefault();
          if (value > min) onChange(value - 1);
        } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
          e.preventDefault();
          if (value < max) onChange(value + 1);
        }
      }}
      className={clsx(
        "relative h-4 cursor-pointer select-none touch-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-4",
        className
      )}
    >
      <div className="absolute inset-x-0 top-1/2 h-4 -translate-y-1/2 rounded-full bg-surface-3" />
      <div className="absolute inset-x-[3px] inset-y-0">
        <div
          className="absolute left-0 top-1/2 h-[11px] -translate-y-1/2 rounded-full"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #0AB57F 0%, #F8B073 100%)",
          }}
        />
      </div>
      <div className="absolute inset-x-[15px] inset-y-0">
        <div
          className="absolute top-1/2 h-[30px] w-[30px] -translate-y-1/2 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.25)]"
          style={{
            left: `calc(${pct}% - 15px)`,
            backgroundImage:
              "radial-gradient(circle, #50BE8F 0 8px, #ffffff 8px 100%)",
          }}
        />
      </div>
    </div>
  );
};

type LockedStatProps = {
  amount: string;
  participants: number;
  participantsLabel: string;
  caption: string;
};

const LockedStat = ({
  amount,
  participants,
  participantsLabel,
  caption,
}: LockedStatProps) => (
  <div className="min-w-0">
    {/* Numeric/currency cluster stays LTR in every locale (logo + digits + OGY). */}
    <div dir="ltr" className="flex items-baseline leading-none">
      <span className="inline-flex items-center">
        <img
          src="/ogy_logo.svg"
          alt=""
          className="mr-2 h-4 w-4 shrink-0 object-contain"
        />
        <span className="text-[22px] font-semibold text-content">{amount}</span>
      </span>
      <span className="ml-1 text-base font-semibold text-muted">OGY</span>
    </div>
    <div className="mt-2 text-[13px] font-normal leading-none text-muted">
      <span className="font-semibold text-content">{participants}</span>{" "}
      {participantsLabel}
    </div>
    <div className="mt-2 text-[13px] font-normal leading-none text-muted">
      {caption}
    </div>
  </div>
);

const placeholderReward = {
  ratePercent: 0,
  locked: "0",
  lockedSum: "0",
  count: 0,
  countSum: 0,
};

const EstimateRewards = ({ className, ...restProps }: EstimateRewardsProps) => {
  const { t, locale } = useLocale();
  const booster = useFiveYearBooster();
  const { data, isSuccess, isLoading, isError } = useEstimatedRewards();
  const [activeIndex, setActiveIndex] = useState(5);

  const hasError = !isLoading && isError;
  const current =
    (isSuccess ? data?.[activeIndex - 1] : null) ?? placeholderReward;
  const fiveYears = activeIndex === 5;
  const bonusRate = fiveYears ? booster.data?.rate : null;
  const hasBonus = bonusRate != null && isSuccess;
  const formatRate = (rate: number) =>
    `${rate.toLocaleString(locale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })}%`;
  const firstRound = booster.data?.firstRound;
  const paidSince = firstRound
    ? new Date(`${firstRound}T00:00:00Z`).toLocaleDateString(locale, {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      })
    : null;
  const yearLabel =
    activeIndex === 1
      ? t("governance.estimateRewards.year")
      : t("governance.estimateRewards.years");

  return (
    <Card
      className={`flex flex-col gap-4 !rounded-2xl !bg-surface-1 !border-border-strong ${className ?? ""}`}
      {...restProps}
    >
      <h2 className="text-base font-semibold leading-none text-muted">
        {t("governance.estimateRewards.title")}
      </h2>

      <div className="flex flex-wrap items-center gap-3" aria-live="polite">
        <div
          dir="ltr"
          className="text-[28px] sm:text-[40px] font-bold leading-none text-content"
        >
          {hasBonus
            ? `≈${formatRate(current.ratePercent + bonusRate)}`
            : formatRate(current.ratePercent)}
        </div>
        {hasBonus && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 ps-3 pe-1 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            +{formatRate(bonusRate)} {t("governance.estimateRewards.booster")}
            <a
              href={`#${BOOSTER_HISTORY_ID}`}
              aria-label={t("governance.boosterHistory.link")}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-emerald-500/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <QuestionMarkCircleIcon className="h-4 w-4" aria-hidden="true" />
            </a>
          </span>
        )}
      </div>
      {hasBonus && (
        <p className="text-[13px] leading-5 text-muted">
          {formatRate(current.ratePercent)}{" "}
          {t("governance.estimateRewards.base")}
          {" + "}
          {formatRate(bonusRate)} {t("governance.estimateRewards.booster")}
          {", "}
          {t("governance.estimateRewards.perYear")}
        </p>
      )}

      <DiscreteSlider
        min={1}
        max={5}
        value={activeIndex}
        onChange={setActiveIndex}
        ariaLabel={t("governance.estimateRewards.lockDuration")}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-border pt-4">
        {current.lockedSum != null && (
          <LockedStat
            amount={formatAmountCompact(current.lockedSum)}
            participants={current.countSum}
            participantsLabel={t("governance.estimateRewards.participants")}
            caption={`${t("governance.estimateRewards.lockedForAtLeast")} ${activeIndex} ${yearLabel}`}
          />
        )}
        <LockedStat
          amount={
            fiveYears && booster.data
              ? millify(Number(booster.data.locked / 100_000_000n), 2)
              : formatAmountCompact(current.locked)
          }
          participants={current.count}
          participantsLabel={t("governance.estimateRewards.participants")}
          caption={`${t("governance.estimateRewards.lockedFor")} ${activeIndex} ${yearLabel}`}
        />
        {fiveYears && (
          <div className="min-w-0">
            <div
              dir="ltr"
              className="text-[22px] font-semibold leading-none text-content"
            >
              {booster.data
                ? millify(Number(booster.data.paid / 100_000_000n), 1)
                : t("common.notAvailable")}
              <span className="ml-1 text-base text-muted">OGY</span>
            </div>
            <p className="mt-2 text-[13px] leading-5 text-muted">
              {t("governance.estimateRewards.boosterPaid")}
              {paidSince
                ? ` ${t("governance.estimateRewards.since")} ${paidSince}`
                : ""}
            </p>
          </div>
        )}
      </div>
      {fiveYears && booster.isError && (
        <p className="text-xs leading-5 text-muted" role="status">
          {t("governance.estimateRewards.boosterUnavailable")}
        </p>
      )}

      {isLoading && (
        <>
          <div
            aria-busy="true"
            className="pointer-events-none absolute inset-4 rounded-xl bg-surface-1"
          />
          <div className="pointer-events-none absolute inset-4 rounded-xl bg-muted/20 animate-pulse" />
        </>
      )}
      {hasError && (
        <CardErrorOverlay title={t("governance.estimateRewards.title")} />
      )}
    </Card>
  );
};

export default EstimateRewards;
