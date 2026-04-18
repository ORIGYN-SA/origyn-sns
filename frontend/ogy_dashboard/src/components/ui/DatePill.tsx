import { useState } from "react";
import { DateTime } from "luxon";

type DatePillProps = {
  millis?: number;
  iso?: string;
};

const DatePill = ({ millis, iso }: DatePillProps) => {
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
      onClick={() => setShowRelative((r) => !r)}
      className="inline-block bg-border-faint text-muted text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap cursor-pointer hover:bg-border-strong transition-colors"
    >
      {label}
    </button>
  );
};

export default DatePill;
