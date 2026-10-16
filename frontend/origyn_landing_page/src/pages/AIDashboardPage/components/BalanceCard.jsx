import { useT } from "@/i18n/LocaleContext";
import { toE8s, useFormat } from "../format";
import { incomingCredits, useBalance, useOrders } from "../queries";
import { AutoHeight, ErrorState, Skeleton } from "./ui";

const BalanceCard = () => {
  const t = useT();
  const format = useFormat();
  const balance = useBalance();
  const orders = useOrders();

  const incoming = incomingCredits(orders.data);
  // The incoming line depends on the orders too: wait for both, so the
  // number and its line arrive together.
  const pending = balance.isPending || orders.isPending;
  const held = balance.data ? toE8s(balance.data.held_e8s) : 0n;

  return (
    <section
      aria-busy={pending}
      aria-labelledby="ai-balance-title"
      className="relative overflow-hidden rounded-3xl border border-navy bg-navy p-6 text-start text-surface md:p-8"
    >
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1 bg-brand-gradient-bright"
      />
      <h2
        id="ai-balance-title"
        className="flex h-5 items-center font-mono text-[0.75rem] uppercase tracking-[0.2em] text-white/60"
      >
        {t("aiDashboard.balance.title")}
      </h2>

      {/* Mounted from the first frame, so the card grows smoothly when the
          numbers land and when the incoming line comes and goes. */}
      <AutoHeight>
        <div className="mt-6">
          {pending ? (
            <Skeleton className="h-[clamp(2.5rem,6vw,3.5rem)] w-48 bg-white/10" />
          ) : balance.isLoadingError ? (
            <ErrorState
              error={balance.error}
              onRetry={() => balance.refetch()}
              retrying={balance.isFetching}
            />
          ) : (
            <>
              <p
                aria-live="polite"
                className="text-[clamp(2.5rem,6vw,3.5rem)] font-extralight leading-none tracking-tight tabular-nums"
              >
                {format.credits(balance.data.available_e8s)}
              </p>

              {(incoming > 0n || held > 0n) && (
                <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 border-t border-white/10 pt-4 text-sm">
                  {incoming > 0n && (
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#6FD6F5] motion-reduce:animate-none" />
                      <dt className="text-white/60">
                        {t("aiDashboard.balance.incoming")}
                      </dt>
                      <dd className="tabular-nums">
                        +{format.credits(incoming)}
                      </dd>
                    </div>
                  )}
                  {held > 0n && (
                    <div className="flex items-center gap-2">
                      <dt className="text-white/60">
                        {t("aiDashboard.balance.held")}
                      </dt>
                      <dd className="tabular-nums">{format.credits(held)}</dd>
                    </div>
                  )}
                </dl>
              )}
            </>
          )}
        </div>
      </AutoHeight>
    </section>
  );
};

export default BalanceCard;
