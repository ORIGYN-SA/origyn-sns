import { NewTableColumn } from "@components/ui/NewTable";
import { DatePill, TransactionKindPill } from "@components/ui";
import CopyToClipboard from "@components/buttons/CopyToClipboard";
import { roundAndFormatLocale, divideBy1e8 } from "@helpers/numbers";
import { buildFakeRows } from "@helpers/skeleton/fakeData";

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

type IndexSort = {
  desc: boolean;
  onToggle: () => void;
};

type TranslateFn = (key: string) => string;

const defaultT: TranslateFn = (key) => {
  const fallbacks: Record<string, string> = {
    "common.index": "Index",
    "common.amount": "Amount",
    "common.type": "Type",
    "common.date": "Date",
    "common.from": "From",
    "common.to": "To",
  };
  return fallbacks[key] ?? key;
};

export const getTransactionColumns = (
  navigate: (path: string) => void,
  t: TranslateFn = defaultT,
  indexSort?: IndexSort
): NewTableColumn<TransactionRow>[] => [
  {
    id: "index",
    header: indexSort ? (
      <button
        onClick={indexSort.onToggle}
        className="flex items-center gap-1 hover:text-white/80"
      >
        {t("common.index")}{" "}
        <span aria-hidden="true">{indexSort.desc ? "↓" : "↑"}</span>
      </button>
    ) : (
      t("common.index")
    ),
    cell: (row) => (
      <div className="w-20">
        <button
          className="hover:underline"
          onClick={() =>
            navigate(`/transaction-history/transactions/${row.index}`)
          }
        >
          {row.index}
        </button>
      </div>
    ),
  },
  {
    id: "amount",
    header: t("common.amount"),
    cell: (row) => (
      // Numeric amount: keep LTR so RTL bidi doesn't reorder digits/grouping.
      <div dir="ltr" className="w-32 whitespace-nowrap">
        <span>
          {roundAndFormatLocale({ number: divideBy1e8(parseInt(row.amount)) })}
        </span>
      </div>
    ),
  },
  {
    id: "kind",
    header: t("common.type"),
    cell: (row) => (
      <div className="w-20">
        <TransactionKindPill kind={row.kind} />
      </div>
    ),
  },
  {
    id: "timestamp",
    header: t("common.date"),
    cell: (row) => (
      <div className="w-44">
        {row.timestampRaw ? (
          <DatePill millis={row.timestampRaw / 1_000_000} />
        ) : null}
      </div>
    ),
  },
  {
    id: "from_account",
    header: t("common.from"),
    cell: (row) => {
      const val = row.from_account;
      const isCopyable = val && val !== "Minting account";
      return (
        // Account/principal ID + copy icon: an inherently-LTR cluster; pin dir
        // so the truncation ellipsis and copy button don't scramble under RTL.
        <div dir="ltr" className="flex items-center gap-2 w-64">
          {isCopyable ? (
            <button
              className="truncate min-w-0 hover:underline"
              onClick={() =>
                navigate(`/transaction-history/transactions/accounts/${val}`)
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
    header: t("common.to"),
    cell: (row) => {
      const val = row.to_account;
      const isCopyable = val && val !== "Minting account";
      return (
        // Account/principal ID + copy icon: an inherently-LTR cluster; pin dir
        // so the truncation ellipsis and copy button don't scramble under RTL.
        <div dir="ltr" className="flex items-center gap-2 w-64">
          {isCopyable ? (
            <button
              className="truncate min-w-0 hover:underline"
              onClick={() =>
                navigate(`/transaction-history/transactions/accounts/${val}`)
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
