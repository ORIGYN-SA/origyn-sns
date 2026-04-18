import { useState } from "react";
import { NewTableColumn } from "@components/ui/NewTable";
import CopyToClipboard from "@components/buttons/CopyToClipboard";
import { roundAndFormatLocale, divideBy1e8 } from "@helpers/numbers";
import { buildFakeRows } from "@helpers/skeleton/fakeData";
import { DateTime } from "luxon";

export type TransactionRow = {
  index: number;
  timestampRaw: number;
  timestamp: string;
  from_account: string;
  to_account: string;
  amount: string;
  fee: string;
  memo: string;
  kind: string;
};

const DateCell = ({ timestampRaw }: { timestampRaw: number }) => {
  const [showRelative, setShowRelative] = useState(false);
  if (!timestampRaw) return null;
  const dt = DateTime.fromMillis(timestampRaw / 1_000_000);
  const label = showRelative
    ? dt.toRelative() ?? ""
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

const KIND_COLORS: Record<string, string> = {
  mint: "bg-teal-100 text-teal-700",
  approve: "bg-amber-100 text-amber-700",
  burn: "bg-orange-100 text-orange-700",
  transfer: "bg-indigo-100 text-indigo-700",
};

type IndexSort = {
  desc: boolean;
  onToggle: () => void;
};

export const getTransactionColumns = (
  navigate: (path: string) => void,
  indexSort?: IndexSort
): NewTableColumn<TransactionRow>[] => [
  {
    id: "index",
    header: indexSort ? (
      <button
        onClick={indexSort.onToggle}
        className="flex items-center gap-1 hover:text-white/80"
      >
        Index <span aria-hidden="true">{indexSort.desc ? "↓" : "↑"}</span>
      </button>
    ) : (
      "Index"
    ),
    cell: (row) => (
      <div className="w-20">
        <button
          className="hover:underline"
          onClick={() => navigate(`/explorer/transactions/${row.index}`)}
        >
          {row.index}
        </button>
      </div>
    ),
  },
  {
    id: "amount",
    header: "Amount",
    cell: (row) => (
      <div className="w-32 whitespace-nowrap">
        <span>{roundAndFormatLocale({ number: divideBy1e8(parseInt(row.amount)) })}</span>
      </div>
    ),
  },
  {
    id: "kind",
    header: "Type",
    cell: (row) => (
      <div className="w-20">
        <span
          className={`inline-block text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap capitalize ${KIND_COLORS[row.kind] ?? "bg-border-faint text-muted"}`}
        >
          {row.kind}
        </span>
      </div>
    ),
  },
  {
    id: "timestamp",
    header: "Date",
    cell: (row) => (
      <div className="w-44">
        <DateCell timestampRaw={row.timestampRaw} />
      </div>
    ),
  },
  {
    id: "from_account",
    header: "From",
    cell: (row) => {
      const val = row.from_account;
      const isCopyable = val && val !== "Minting account";
      return (
        <div className="flex items-center gap-2 w-64">
          {isCopyable ? (
            <button
              className="truncate min-w-0 hover:underline"
              onClick={() =>
                navigate(`/explorer/transactions/accounts/${val}`)
              }
            >
              {val}
            </button>
          ) : (
            <span className="truncate min-w-0">{val || "-"}</span>
          )}
          <div className="ml-auto shrink-0">
            {isCopyable ? (
              <CopyToClipboard value={val} />
            ) : (
              <div className="inline-block w-4 h-4" aria-hidden="true" />
            )}
          </div>
        </div>
      );
    },
  },
  {
    id: "to_account",
    header: "To",
    cell: (row) => {
      const val = row.to_account;
      const isCopyable = val && val !== "Minting account";
      return (
        <div className="flex items-center gap-2 w-64">
          {isCopyable ? (
            <button
              className="truncate min-w-0 hover:underline"
              onClick={() =>
                navigate(`/explorer/transactions/accounts/${val}`)
              }
            >
              {val}
            </button>
          ) : (
            <span className="truncate min-w-0">{val || "-"}</span>
          )}
          <div className="ml-auto shrink-0">
            {isCopyable ? (
              <CopyToClipboard value={val} />
            ) : (
              <div className="inline-block w-4 h-4" aria-hidden="true" />
            )}
          </div>
        </div>
      );
    },
  },
];

const FAKE_ROW: TransactionRow = {
  index: 100000,
  amount: "1000000000",
  kind: "transfer",
  timestampRaw: Date.now() * 1_000_000,
  timestamp: "",
  from_account: "aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaa",
  to_account: "bbbbb-bbbbb-bbbbb-bbbbb-bbbbb-bbbbb-bbbbb-bbbbb-bbbbb-bbb",
  fee: "",
  memo: "",
};

export const buildSkeletonRows = (count: number): TransactionRow[] =>
  buildFakeRows(FAKE_ROW, count);
