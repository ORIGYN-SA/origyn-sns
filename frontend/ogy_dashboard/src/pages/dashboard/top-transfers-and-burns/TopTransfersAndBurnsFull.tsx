import { useMemo } from "react";
import { Badge, Skeleton } from "@components/ui";
import { ColumnDef } from "@tanstack/react-table";
import { Table } from "@components/ui";
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

const TopTransfersAndBurnsFull = ({
  type,
  title,
  limit,
}: TopTransfersAndBurnsFullProps) => {
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useTopTransfersAndBurns({
    type,
    limit,
  });

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
                  navigate(`/explorer/transactions/accounts/${address}`)
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
                  navigate(`/explorer/transactions/accounts/${address}`)
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

  return (
    <>
      <h1 className="text-4xl sm:text-6xl font-bold text-center mt-16 mb-16">
        {title}
      </h1>
      {isLoading && <Skeleton count={limit} height={52} />}
      {isError && (
        <div className="text-red-500">
          An error occurred: {error?.message || "Unknown error"}
        </div>
      )}
      {data && data.length > 0 ? (
        <div className="w-10/12 mx-auto my-8">
          <Table
            columns={columns}
            data={data.map((item, index) => ({ ...item, index }))}
          />
        </div>
      ) : (
        !isLoading && (
          <div className="text-center text-gray-500">No data available.</div>
        )
      )}
    </>
  );
};

export default TopTransfersAndBurnsFull;
