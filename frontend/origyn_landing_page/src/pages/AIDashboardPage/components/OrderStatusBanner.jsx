import { useSearchParams } from "react-router-dom";
import { useT } from "@/i18n/LocaleContext";
import { useFormat } from "../format";
import { isInFlight, MAX_ORDER_POLLS, useOrder } from "../queries";
import { useErrorMessage } from "../useErrorMessage";
import { Spinner } from "./ui";

const SUCCESS = "border-emerald-200 bg-emerald-50 text-emerald-900";
const NEUTRAL = "border-hairline bg-canvas text-ink";
const FAILURE = "border-red-200 bg-red-50 text-red-800";

const toneFor = (status) => {
  if (status === "issued") return SUCCESS;
  if (isInFlight(status)) return NEUTRAL;
  return FAILURE;
};

// Shown after Stripe sends the user back with ?order=<id>. The order query
// also feeds the purchase list and the balance's incoming line, so the whole
// page moves together while this follows the order to the end.
const OrderStatusBanner = ({ orderId }) => {
  const t = useT();
  const format = useFormat();
  const errorMessage = useErrorMessage();
  const [, setSearchParams] = useSearchParams();
  const order = useOrder(orderId);

  const dismiss = () => setSearchParams({}, { replace: true });
  const status = order.data?.status;
  const loadFailed = order.isLoadingError;
  const pollingStopped =
    isInFlight(status) &&
    !order.isFetching &&
    order.dataUpdateCount >= MAX_ORDER_POLLS;
  const waiting =
    !order.error && (!order.data || (isInFlight(status) && !pollingStopped));

  let text;
  if (loadFailed) text = errorMessage(order.error);
  else if (!order.data) text = t("aiDashboard.order.loading");
  else if (pollingStopped) text = t("aiDashboard.order.slow");
  else
    text = t(`aiDashboard.order.status.${status}`)
      .replace("{credits}", format.credits(order.data.credits_e8s))
      .replace("{amount}", format.usd(order.data.usd_cents));

  const tone = loadFailed ? FAILURE : order.data ? toneFor(status) : NEUTRAL;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-between gap-4 rounded-3xl border px-6 py-4 text-sm transition-colors ${tone}`}
    >
      <span className="flex min-w-0 items-center gap-3">
        {status === "issued" ? (
          <span aria-hidden="true" className="text-base">
            ✓
          </span>
        ) : (
          waiting && <Spinner />
        )}
        {text}
      </span>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t("aiDashboard.order.dismiss")}
        className="-me-2 inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-lg leading-none opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-navy"
      >
        ×
      </button>
    </div>
  );
};

export default OrderStatusBanner;
