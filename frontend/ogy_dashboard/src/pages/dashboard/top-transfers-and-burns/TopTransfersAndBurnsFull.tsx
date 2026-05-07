import { useMemo } from "react";
import { Badge, SkeletonOverlay } from "@components/ui";
import { ColumnDef } from "@tanstack/react-table";
import { Table } from "@components/ui";
import { CardErrorOverlay } from "@components/dashboard";
import { buildFakeRows } from "@helpers/skeleton/fakeData";
import useTopTransfersAndBurns, {
  TransformedData,
} from "@hooks/metrics/useTopTransfersAndBurns";
import CopyToClipboard from "@components/buttons/CopyToClipboard";
import { useNavigate } from "react-router-dom";
import { roundAndFormatLocale } from "@helpers/numbers";

interface TopTransfersAndBurnsFullProps {
  type: "transfers" | "burns";
  title: string;
  limit: number;
}

const FAKE_ROW: TransformedData = {
  hash: "0000000000000000000000000000000000000000000000000000000000000000",
  from: "0000000000000000000000000000000000000000000000000000000000000000",
  to: "0000000000000000000000000000000000000000000000000000000000000000",
  value: "0",
  fee: "0",
  time: "—",
};

const TopTransfersAndBurnsFull = ({
  type,
  title,
  limit,
}: TopTransfersAndBurnsFullProps) => {
  const navigate = useNavigate();
  const { data, isSuccess, isLoading, isError } = useTopTransfersAndBurns({
    type,
    limit,
  });
  const hasError = !isLoading && isError;
  const showSkeleton = isLoading || hasError;
  const hasData = isSuccess && data && data.length > 0;

  const columns: ColumnDef<TransformedData>[] = useMemo(() => {
    const baseColumns: ColumnDef<TransformedData>[] = [
      {
        accessorKey: "index",
        header: "#",
        cell: ({ row }) => <span>{row.index + 1}</span>,
      },
      {
        accessorKey: "from",
        header: "From",
        cell: ({ getValue }) => {
          const address = String(getValue());
          return (
            <div className="flex items-center max-w-sm truncate">
              <button
                className="mr-2 truncate"
                onClick={() =>
                  navigate(`/transaction-history/transactions/accounts/${address}`)
                }
              >
                {address}
              </button>
              <CopyToClipboard value={address} />
            </div>
          );
        },
      },
      {
        accessorKey: "value",
        header: "Value",
        cell: ({ getValue }) => {
          const rawValue = parseFloat(
            String(getValue()).replace(/[^\d.-]/g, "")
          );
          return isNaN(rawValue) ? (
            <span>N/A</span>
          ) : (
            <span className="flex flex-row items-center justify-center">
              {roundAndFormatLocale({ number: rawValue })}{" "}
              <img
                src="/ogy_logo.svg"
                alt="OGY Logo"
                className="w-5 h-5 ml-2"
              />
            </span>
          );
        },
      },
      {
        accessorKey: "time",
        header: "Time",
        cell: ({ getValue }) => (
          <div>
            <Badge className="bg-slate-500/20 px-2">
              <div className="text-slate-500 text-xs font-semibold shrink-0">
                {String(getValue())}
              </div>
            </Badge>
          </div>
        ),
      },
    ];

    if (type !== "burns") {
      baseColumns.splice(2, 0, {
        accessorKey: "to",
        header: "To",
        cell: ({ getValue }) => {
          const address = String(getValue());
          return (
            <div className="flex items-center max-w-xs truncate justify-center">
              <button
                className="mr-2 truncate"
                onClick={() =>
                  navigate(`/transaction-history/transactions/accounts/${address}`)
                }
              >
                {address}
              </button>
              <CopyToClipboard value={address} />
            </div>
          );
        },
      });
    }

    return baseColumns;
  }, [type, navigate]);

  const rows = showSkeleton || !hasData ? buildFakeRows(FAKE_ROW, limit) : data;
  const showEmptyState = !showSkeleton && isSuccess && (!data || data.length === 0);

  return (
    <>
      <h1 className="text-4xl sm:text-6xl font-bold text-center mt-16 mb-16">
        {title}
      </h1>
      <div className="relative w-10/12 mx-auto my-8">
        {showEmptyState ? (
          <div className="text-center text-muted">No data available.</div>
        ) : (
          <SkeletonOverlay loading={showSkeleton}>
            <Table
              columns={columns}
              data={rows.map((item, index) => ({ ...item, index }))}
            />
          </SkeletonOverlay>
        )}
        {hasError && <CardErrorOverlay title={title} />}
      </div>
    </>
  );
};

export default TopTransfersAndBurnsFull;
