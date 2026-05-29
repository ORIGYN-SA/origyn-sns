import { useT } from "@i18n/LocaleContext";

const KIND_COLORS: Record<string, string> = {
  mint: "border border-teal-500/25 bg-teal-500/10 text-teal-700 dark:text-teal-300",
  approve:
    "border border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  burn: "border border-orange-500/25 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  transfer:
    "border border-indigo-500/25 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
};

type TransactionKindPillProps = {
  kind?: string;
};

const TransactionKindPill = ({ kind }: TransactionKindPillProps) => {
  const t = useT();
  const resolved = kind ?? "transfer";
  // Translate known kinds; fall back to the raw kind for anything unmapped
  // (t() returns the key path itself when a catalog entry is missing).
  const key = `transactions.kind.${resolved}`;
  const translated = t(key);
  const label = translated === key ? resolved : translated;

  return (
    <span
      className={`inline-block text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap capitalize ${
        KIND_COLORS[resolved] ??
        "border border-border-strong bg-surface-2 text-muted"
      }`}
    >
      {label}
    </span>
  );
};

export default TransactionKindPill;
