import { useState } from "react";
import { AnimatePresence, motion as Motion } from "motion/react";
import { useT } from "@/i18n/LocaleContext";
import { useFormat } from "../format";
import { collapse } from "../motion";
import { useOrders } from "../queries";
import {
  ErrorState,
  LIST,
  LIST_ITEM,
  Panel,
  SecondaryButton,
  Skeleton,
  StatusPill,
} from "./ui";

const COLLAPSED_ROWS = 5;
const UNPAID = new Set(["quoted", "expired"]);
// Skeleton and real rows share one height, so loading never shifts the list.
const ROW = "flex min-h-[5.25rem] items-center justify-between gap-4 py-4";

const RowSkeleton = () => (
  <li className={LIST_ITEM}>
    <div className={ROW}>
      <span className="flex flex-col gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </span>
      <span className="flex flex-col items-end gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </span>
    </div>
  </li>
);

const Purchases = () => {
  const t = useT();
  const format = useFormat();
  const orders = useOrders();
  const [expanded, setExpanded] = useState(false);

  // A purchase is something paid for. A checkout still open at Stripe
  // (quoted) or left to lapse (expired) can't be resumed from here, so it
  // has no place in the history; a fresh purchase is one click away.
  const rows = (orders.data ?? []).filter((order) => !UNPAID.has(order.status));
  const visible = expanded ? rows : rows.slice(0, COLLAPSED_ROWS);

  return (
    <Panel title={t("aiDashboard.orders.title")} busy={orders.isPending}>
      {orders.isPending ? (
        <ul className={LIST}>
          <RowSkeleton />
          <RowSkeleton />
          <RowSkeleton />
        </ul>
      ) : orders.isLoadingError ? (
        <ErrorState
          error={orders.error}
          onRetry={() => orders.refetch()}
          retrying={orders.isFetching}
        />
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-hairline px-6 py-8 text-center text-sm text-muted">
          {t("aiDashboard.orders.empty")}
        </p>
      ) : (
        <>
          <ul className={LIST}>
            <AnimatePresence initial={false}>
              {visible.map((order) => (
                <Motion.li key={order.id} {...collapse} className={LIST_ITEM}>
                  <div className={ROW}>
                    <span className="min-w-0">
                      <span className="block text-sm tabular-nums text-ink">
                        {t("aiDashboard.orders.creditsLine").replace(
                          "{credits}",
                          format.credits(order.credits_e8s),
                        )}
                      </span>
                      <time
                        dateTime={order.created_at}
                        title={format.dateTime(order.created_at)}
                        className="mt-1 block text-xs text-muted"
                      >
                        {format.day(order.created_at)}
                      </time>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="text-sm tabular-nums text-ink">
                        {format.usd(order.usd_cents)}
                      </span>
                      <StatusPill status={order.status} />
                    </span>
                  </div>
                </Motion.li>
              ))}
            </AnimatePresence>
          </ul>
          {rows.length > COLLAPSED_ROWS && (
            <SecondaryButton
              onClick={() => setExpanded((open) => !open)}
              aria-expanded={expanded}
              className="mt-6 w-full"
            >
              {expanded
                ? t("aiDashboard.orders.showLess")
                : t("aiDashboard.orders.showAll").replace(
                    "{count}",
                    rows.length,
                  )}
            </SecondaryButton>
          )}
        </>
      )}
    </Panel>
  );
};

export default Purchases;
