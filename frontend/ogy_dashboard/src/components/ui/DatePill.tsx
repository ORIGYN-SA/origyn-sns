import { useState } from "react";
import { DateTime } from "luxon";
import { useT } from "@i18n/LocaleContext";

type DatePillProps = {
  millis?: number;
  iso?: string;
};

const DatePill = ({ millis, iso }: DatePillProps) => {
  const t = useT();
  const [showRelative, setShowRelative] = useState(false);

  const dt =
    millis !== undefined
      ? DateTime.fromMillis(millis)
      : iso
        ? DateTime.fromISO(iso)
        : null;

  if (!dt || !dt.isValid) return null;

  const label = showRelative
    ? (dt.toRelative() ?? "")
    : dt.toFormat("yyyy-LL-dd, HH:mm:ss");

  return (
    <button
      type="button"
      // Formatted date/time is a numeric cluster — keep it LTR so RTL bidi
      // doesn't reorder the segments or float the comma.
      dir="ltr"
      aria-label={`${t("ui.toggleRelativeTime")} ${label}`}
      onClick={() => setShowRelative((r) => !r)}
      className="inline-flex rounded-full border border-border-strong bg-surface-2 px-3 py-1 text-xs font-semibold text-content/80 whitespace-nowrap cursor-pointer transition-colors hover:bg-surface-3 hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-content/30"
    >
      {label}
    </button>
  );
};

export default DatePill;
