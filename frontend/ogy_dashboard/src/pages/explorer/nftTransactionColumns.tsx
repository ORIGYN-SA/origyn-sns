import { NewTableColumn } from "@components/ui/NewTable";
import { DatePill, TransactionKindPill } from "@components/ui";
import { shortenId } from "@helpers/strings";
import { buildFakeRows } from "@helpers/skeleton/fakeData";
import { ApiNftTransaction } from "@services/queries/nft/fetchNftTransactions";

export type NftTransactionRow = ApiNftTransaction;

type TranslateFn = (key: string) => string;

type NavigateFn = (path: string) => void;

type NftTransactionColumn = NewTableColumn<NftTransactionRow>;

export type NftTransactionColumnOptions = {
  showCertificate?: boolean;
  showCollection?: boolean;
  showDirection?: boolean;
};

const AccountCell = ({
  account,
  navigate,
}: {
  account?: string | null;
  navigate: NavigateFn;
}) => (
  // Pin dir so the truncation ellipsis doesn't scramble under RTL.
  <div dir="ltr" className="w-48">
    {account ? (
      <button
        className="truncate min-w-0 hover:underline"
        title={account}
        onClick={() => navigate(`/viewer/collectors/${account}`)}
      >
        {shortenId(account)}
      </button>
    ) : (
      <span className="text-muted">-</span>
    )}
  </div>
);

const DIRECTION_CLASSES: Record<string, string> = {
  in: "border border-teal-500/25 bg-teal-500/10 text-teal-700 dark:text-teal-300",
  out: "border border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300",
};

const DIRECTION_FALLBACK_CLASSES =
  "border border-border-strong bg-surface-2 text-muted";

const DirectionCell = ({
  direction,
  t,
}: {
  direction?: string | null;
  t: TranslateFn;
}) => (
  <div className="w-20">
    {direction ? (
      <span
        className={`inline-block text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${
          DIRECTION_CLASSES[direction] ?? DIRECTION_FALLBACK_CLASSES
        }`}
      >
        {t(`explorer.transactions.${direction}`)}
      </span>
    ) : (
      <span className="text-muted">-</span>
    )}
  </div>
);

const CertificateCell = ({
  row,
  navigate,
  showCollection,
}: {
  row: NftTransactionRow;
  navigate: NavigateFn;
  showCollection: boolean;
}) => (
  <div className="w-44 min-w-0">
    <button
      className="truncate max-w-full hover:underline"
      onClick={() =>
        navigate(
          `/viewer/certificate/${row.collection}/${encodeURIComponent(
            row.token_id
          )}`
        )
      }
    >
      #{row.token_id}
    </button>
    {showCollection && (
      <button
        className="block truncate max-w-full text-xs text-muted hover:text-content transition-colors"
        title={row.collection_name ?? row.collection}
        onClick={() => navigate(`/viewer/collections/${row.collection}`)}
      >
        {row.collection_name ?? shortenId(row.collection)}
      </button>
    )}
  </div>
);

const isVisible = (
  column: NftTransactionColumn | false
): column is NftTransactionColumn => column !== false;

export const getNftTransactionColumns = (
  navigate: NavigateFn,
  t: TranslateFn,
  {
    showCertificate = true,
    showCollection = true,
    showDirection = false,
  }: NftTransactionColumnOptions = {}
): NftTransactionColumn[] => {
  const columns: (NftTransactionColumn | false)[] = [
    {
      id: "block_id",
      header: t("common.index"),
      cell: (row) => (
        <div dir="ltr" className="w-20">
          <button
            className="hover:underline"
            onClick={() =>
              navigate(
                `/viewer/transaction/${row.collection}/${encodeURIComponent(
                  row.token_id
                )}/${row.block_id}`
              )
            }
          >
            {row.block_id}
          </button>
        </div>
      ),
    },
    {
      id: "event_type",
      header: t("common.type"),
      cell: (row) => (
        <div className="w-24">
          <TransactionKindPill kind={row.event_type} />
        </div>
      ),
    },
    showDirection && {
      id: "direction",
      header: t("explorer.transactions.direction"),
      cell: (row) => <DirectionCell direction={row.direction} t={t} />,
    },
    showCertificate && {
      id: "token_id",
      header: t("explorer.detail.certificate"),
      cell: (row) => (
        <CertificateCell
          row={row}
          navigate={navigate}
          showCollection={showCollection}
        />
      ),
    },
    {
      id: "tx_time",
      header: t("common.date"),
      cell: (row) => (
        <div className="w-44">
          {row.tx_time ? <DatePill millis={row.tx_time} /> : null}
        </div>
      ),
    },
    {
      id: "from_account",
      header: t("common.from"),
      cell: (row) => (
        <AccountCell account={row.from_account} navigate={navigate} />
      ),
    },
    {
      id: "to_account",
      header: t("common.to"),
      cell: (row) => (
        <AccountCell account={row.to_account} navigate={navigate} />
      ),
    },
  ];

  return columns.filter(isVisible);
};

const FAKE_ROW: NftTransactionRow = {
  block_id: 10000,
  event_type: "transfer",
  collection: "aaaaa-aaaaa-aaaaa-aaaaa-cai",
  collection_name: "Collection name",
  token_id: "000",
  from_account: "aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaa",
  to_account: "bbbbb-bbbbb-bbbbb-bbbbb-bbbbb-bbbbb-bbbbb-bbbbb-bbbbb-bbb",
  tx_time: Date.now(),
  direction: "in",
};

export const buildNftTransactionSkeletonRows = (
  count: number
): NftTransactionRow[] => buildFakeRows(FAKE_ROW, count);
