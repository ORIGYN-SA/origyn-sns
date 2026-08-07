import { NewTableColumn } from "@components/ui/NewTable";
import { DatePill, TransactionKindPill } from "@components/ui";
import { shortenId } from "@helpers/strings";
import { buildFakeRows } from "@helpers/skeleton/fakeData";
import { ApiNftTransaction } from "@services/queries/nft/fetchNftTransactions";

export type NftTransactionRow = ApiNftTransaction;

type TranslateFn = (key: string) => string;

type NavigateFn = (path: string) => void;

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

export const getNftTransactionColumns = (
  navigate: NavigateFn,
  t: TranslateFn
): NewTableColumn<NftTransactionRow>[] => [
  {
    id: "block_id",
    header: t("common.index"),
    cell: (row) => (
      <div dir="ltr" className="w-20">
        {row.block_id}
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
  {
    id: "token_id",
    header: t("explorer.detail.certificate"),
    cell: (row) => (
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
        <button
          className="block truncate max-w-full text-xs text-muted hover:text-content transition-colors"
          title={row.collection_name ?? row.collection}
          onClick={() => navigate(`/viewer/collections/${row.collection}`)}
        >
          {row.collection_name ?? shortenId(row.collection)}
        </button>
      </div>
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
    cell: (row) => <AccountCell account={row.to_account} navigate={navigate} />,
  },
];

const FAKE_ROW: NftTransactionRow = {
  block_id: 10000,
  event_type: "transfer",
  collection: "aaaaa-aaaaa-aaaaa-aaaaa-cai",
  collection_name: "Collection name",
  token_id: "000",
  from_account: "aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaa",
  to_account: "bbbbb-bbbbb-bbbbb-bbbbb-bbbbb-bbbbb-bbbbb-bbbbb-bbbbb-bbb",
  tx_time: Date.now(),
};

export const buildNftTransactionSkeletonRows = (
  count: number
): NftTransactionRow[] => buildFakeRows(FAKE_ROW, count);
