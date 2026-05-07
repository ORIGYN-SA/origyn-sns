import { useMemo } from "react";
import { Badge, Button, Card, SkeletonOverlay } from "@components/ui";
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

interface TopTransfersAndBurnsProps {
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

const TopTransfersAndBurns = ({
  type,
  title,
  limit,
}: TopTransfersAndBurnsProps) => {
  const navigate = useNavigate();
  const { data, isSuccess, isLoading, isError } = useTopTransfersAndBurns({
    type,
    limit,
  });

  const hasError = !isLoading && isError;
  const showSkeleton = isLoading || hasError;

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
            <div className="flex items-center max-w-sm truncate justify-center place-items-center">
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

  const handleClick = () => {
    navigate(`/${type}`);
  };

  const rows =
    showSkeleton || !isSuccess || !data
      ? buildFakeRows(FAKE_ROW, limit)
      : data;

  return (
    <Card className="p-6 space-y-6">
      <div data-skel-static className="flex flex-row items-center">
        <div className="text-lg font-semibold">{title}</div>
        <Button onClick={() => handleClick()} className="ml-auto md:ml-6">
          Show All
        </Button>
      </div>
      {hasError && <CardErrorOverlay title={title} />}
      <SkeletonOverlay loading={showSkeleton}>
        <Table
          columns={columns}
          data={rows.map((item, index) => ({ ...item, index }))}
        />
      </SkeletonOverlay>
    </Card>
  );
};

export default TopTransfersAndBurns;
