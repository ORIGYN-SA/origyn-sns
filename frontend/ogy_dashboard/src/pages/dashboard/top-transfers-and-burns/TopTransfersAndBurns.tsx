import { useMemo } from "react";
import {
  Badge,
  Button,
  Card,
  Skeleton,
  Tooltip,
  TooltipInfo,
} from "@components/ui";
import { ColumnDef } from "@tanstack/react-table";
import { Table } from "@components/ui";
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

const TopTransfersAndBurns = ({
  type,
  title,
  limit,
}: TopTransfersAndBurnsProps) => {
  const navigate = useNavigate();
  const { data, isLoading, isSuccess, isError, error } =
    useTopTransfersAndBurns({
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
        cell: ({ getValue, row }) => {
          const address = String(getValue());
          return (
            <div
              className={`flex items-center justify-center ${type === "burns" && "w-full mx-auto"} md:max-w-sm max-w-64`}
            >
              <>
                <button
                  data-tooltip-id="tooltip_bt_address"
                  data-tooltip-content={address}
                  className="mr-2 truncate "
                  onClick={() =>
                    navigate(`/explorer/transactions/accounts/${address}`)
                  }
                >
                  {address}
                </button>
              </>
              <CopyToClipboard value={address} />

              {row?.original?.tagFrom && (
                <div className="ml-3">
                  <TooltipInfo
                    id={`tooltip_${row?.original?.tagFrom}`}
                    clickable={false}
                  >
                    {row?.original?.tagFrom}
                  </TooltipInfo>
                </div>
              )}
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
        cell: ({ getValue, row }) => {
          const address = String(getValue());
          return (
            <div className="flex items-center  justify-center md:max-w-sm max-w-64">
              <>
                <button
                  data-tooltip-id="tooltip_bt_address"
                  data-tooltip-content={address}
                  className="mr-2 truncate"
                  onClick={() =>
                    navigate(`/explorer/transactions/accounts/${address}`)
                  }
                >
                  {address}
                </button>
              </>
              <CopyToClipboard value={address} />

              {row?.original?.tagTo && (
                <div className="ml-3">
                  <TooltipInfo
                    id={`tooltip_${row?.original?.tagTo}`}
                    clickable={false}
                  >
                    {row?.original?.tagTo}
                  </TooltipInfo>
                </div>
              )}
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

  return (
    <>
      <Card className="p-6 space-y-6">
        <div className="flex flex-row items-center">
          <div className="text-lg font-semibold">{title}</div>
          <Button onClick={() => handleClick()} className="ml-auto md:ml-6">
            Show All
          </Button>
          <Tooltip id="tooltip_bt_address" />
        </div>
        {isLoading && <Skeleton count={5} height={52} />}
        {isError && (
          <div className="text-red-500">
            An error occurred: {error?.message || "Unknown error"}
          </div>
        )}
        {data && data.length > 0 && isSuccess ? (
          <Table
            columns={columns}
            data={data.map((item, index) => ({ ...item, index }))}
          />
        ) : (
          !isLoading && (
            <div className="text-center text-gray-500">No data available.</div>
          )
        )}
      </Card>
    </>
  );
};

export default TopTransfersAndBurns;
