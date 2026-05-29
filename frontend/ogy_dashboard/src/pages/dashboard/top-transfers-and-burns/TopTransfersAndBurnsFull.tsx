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
import { useT, useLocalePath } from "@i18n/LocaleContext";

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
  const t = useT();
  const lp = useLocalePath();
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
        header: t("common.from"),
        cell: ({ getValue }) => {
          const address = String(getValue());
          return (
            <div dir="ltr" className="flex items-center max-w-sm truncate">
              <button
                className="me-2 truncate"
                onClick={() =>
                  navigate(
                    lp(`/transaction-history/transactions/accounts/${address}`)
                  )
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
        header: t("dashboard.topTransfers.value"),
        cell: ({ getValue }) => {
          const rawValue = parseFloat(
            String(getValue()).replace(/[^\d.-]/g, "")
          );
          return isNaN(rawValue) ? (
            <span>{t("common.notAvailable")}</span>
          ) : (
            <span
              dir="ltr"
              className="flex flex-row items-center justify-center"
            >
              {roundAndFormatLocale({ number: rawValue })}{" "}
              <img
                src="/ogy_logo.svg"
                alt={t("dashboard.topTransfers.ogyLogoAlt")}
                className="w-5 h-5 ms-2"
              />
            </span>
          );
        },
      },
      {
        accessorKey: "time",
        header: t("dashboard.topTransfers.time"),
        cell: ({ getValue }) => (
          <div>
            <Badge className="border border-border-strong bg-surface-2 px-2">
              <div className="text-xs font-semibold text-content/80 shrink-0">
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
        header: t("common.to"),
        cell: ({ getValue }) => {
          const address = String(getValue());
          return (
            <div dir="ltr" className="flex items-center max-w-xs truncate justify-center">
              <button
                className="me-2 truncate"
                onClick={() =>
                  navigate(
                    lp(`/transaction-history/transactions/accounts/${address}`)
                  )
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
  }, [type, navigate, lp, t]);

  const rows = showSkeleton || !hasData ? buildFakeRows(FAKE_ROW, limit) : data;
  const showEmptyState =
    !showSkeleton && isSuccess && (!data || data.length === 0);

  return (
    <>
      <h1 className="text-4xl sm:text-6xl font-bold text-center mt-16 mb-16">
        {title}
      </h1>
      <div className="relative w-10/12 mx-auto my-8">
        {showEmptyState ? (
          <div className="text-center text-muted">
            {t("dashboard.topTransfers.noDataAvailable")}
          </div>
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
