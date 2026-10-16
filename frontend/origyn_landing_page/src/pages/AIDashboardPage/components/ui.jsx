import { useCallback, useState } from "react";
import { motion as Motion } from "motion/react";
import { useT } from "@/i18n/LocaleContext";
import { RESIZE } from "../motion";
import { isIncoming } from "../queries";
import { useErrorMessage } from "../useErrorMessage";

// Follows its content's height with an animation instead of snapping, so a
// panel that gains or loses content slides everything below it rather than
// jumping. Clips only while moving, so focus rings and bleeds stay visible.
export const AutoHeight = ({ children }) => {
  const [height, setHeight] = useState("auto");
  const [moving, setMoving] = useState(false);
  const measure = useCallback((node) => {
    if (!node) return;
    const observer = new ResizeObserver(([entry]) =>
      setHeight(entry.borderBoxSize[0].blockSize),
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <Motion.div
      initial={false}
      animate={{ height }}
      transition={RESIZE}
      onAnimationStart={() => setMoving(true)}
      onAnimationComplete={() => setMoving(false)}
      style={{ overflow: moving ? "hidden" : "visible" }}
    >
      {/* flow-root keeps the first child's top margin inside what is measured;
          otherwise it would collapse outward and snap in at the end. */}
      <div ref={measure} className="flow-root">
        {children}
      </div>
    </Motion.div>
  );
};

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy";

// A panel header's action: text-sized so it shares the title's line and
// every header is the same height. Its padding gives a full touch target
// and is pulled back with negative margins so it takes no extra room.
export const HeaderAction = ({ className = "", ...props }) => (
  <button
    type="button"
    className={`-me-3 -my-2 inline-flex h-9 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[0.8125rem] font-medium text-navy transition-colors hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent ${focusRing} ${className}`}
    {...props}
  />
);

// Rows carry their own vertical padding so a row's hit area and divider sit
// evenly between neighbours. The list pulls that padding back at its ends,
// so the first and last rows line up with the panel's own padding.
export const LIST = "-my-4";
export const LIST_ITEM = "border-b border-hairline last:border-0";

export const Panel = ({
  title,
  action,
  busy = false,
  children,
  className = "",
}) => (
  <section
    aria-busy={busy}
    className={`rounded-3xl border border-[#ececec] bg-surface p-6 text-start md:p-8 ${className}`}
  >
    <header className="mb-6 flex h-5 items-center justify-between gap-4">
      <h2 className="font-mono text-[0.75rem] uppercase tracking-[0.2em] text-muted">
        {title}
      </h2>
      {action}
    </header>
    <AutoHeight>{children}</AutoHeight>
  </section>
);

export const PrimaryButton = ({
  className = "",
  type = "button",
  ...props
}) => (
  <button
    type={type}
    className={`inline-flex h-11 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full bg-navy px-6 text-[0.8125rem] font-medium text-surface transition-[opacity,transform] hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${focusRing} ${className}`}
    {...props}
  />
);

export const SecondaryButton = ({
  className = "",
  type = "button",
  ...props
}) => (
  <button
    type={type}
    className={`inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full border border-hairline px-4 text-[0.8125rem] text-ink transition-colors hover:border-navy disabled:cursor-not-allowed disabled:opacity-50 ${focusRing} ${className}`}
    {...props}
  />
);

export const DangerButton = ({ className = "", type = "button", ...props }) => (
  <button
    type={type}
    className={`inline-flex min-h-9 cursor-pointer items-center justify-center whitespace-nowrap rounded-full bg-red-600 px-4 text-[0.8125rem] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 ${className}`}
    {...props}
  />
);

export const Spinner = ({ light = false }) => (
  <span
    aria-hidden="true"
    className={`inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 motion-reduce:animate-none ${
      light ? "border-white/30 border-t-white" : "border-navy/20 border-t-navy"
    }`}
  />
);

// Placeholder blocks sized like the content they stand in for, so nothing
// moves when the data arrives.
export const Skeleton = ({ className = "" }) => (
  <span
    aria-hidden="true"
    className={`block animate-pulse rounded-md bg-[#efefef] motion-reduce:animate-none ${className}`}
  />
);

export const ErrorState = ({ error, onRetry, retrying = false }) => {
  const t = useT();
  const errorMessage = useErrorMessage();
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-100 bg-red-50/60 px-4 py-3 text-sm text-red-700"
    >
      <span>{errorMessage(error)}</span>
      {onRetry && (
        <SecondaryButton
          onClick={onRetry}
          disabled={retrying}
          className="min-w-24 border-red-200 bg-white text-red-700 hover:border-red-400"
        >
          {retrying ? <Spinner /> : t("aiDashboard.retry")}
        </SecondaryButton>
      )}
    </div>
  );
};

const TONES = {
  issued: "bg-emerald-50 text-emerald-700",
  paid: "bg-sky-50 text-sky-800",
  awaiting_liquidity: "bg-sky-50 text-sky-800",
  awaiting_price: "bg-sky-50 text-sky-800",
  failed: "bg-red-50 text-red-700",
};

export const StatusPill = ({ status }) => {
  const t = useT();
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs ${
        TONES[status] ?? "bg-canvas text-muted"
      }`}
    >
      {isIncoming(status) && (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current motion-reduce:animate-none" />
      )}
      {t(`aiDashboard.orders.statusLabel.${status}`)}
    </span>
  );
};
