const KIND_COLORS: Record<string, string> = {
  mint: "bg-teal-100 text-teal-700",
  approve: "bg-amber-100 text-amber-700",
  burn: "bg-orange-100 text-orange-700",
  transfer: "bg-indigo-100 text-indigo-700",
};

type TransactionKindPillProps = {
  kind?: string;
};

const TransactionKindPill = ({ kind }: TransactionKindPillProps) => (
  <span
    className={`inline-block text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap capitalize ${
      (kind && KIND_COLORS[kind]) ?? "bg-border-faint text-muted"
    }`}
  >
    {kind ?? "transfer"}
  </span>
);

export default TransactionKindPill;
