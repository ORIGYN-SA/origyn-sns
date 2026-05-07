const KIND_COLORS: Record<string, string> = {
  mint:
    "border border-teal-500/25 bg-teal-500/10 text-teal-700 dark:text-teal-300",
  approve:
    "border border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  burn:
    "border border-orange-500/25 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  transfer:
    "border border-indigo-500/25 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
};

type TransactionKindPillProps = {
  kind?: string;
};

const TransactionKindPill = ({ kind }: TransactionKindPillProps) => (
  <span
    className={`inline-block text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap capitalize ${
      (kind && KIND_COLORS[kind]) ??
      "border border-border-strong bg-surface-2 text-muted"
    }`}
  >
    {kind ?? "transfer"}
  </span>
);

export default TransactionKindPill;
