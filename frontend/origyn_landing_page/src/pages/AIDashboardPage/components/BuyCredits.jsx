import { useRef, useState } from "react";
import { useAuth } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { useT } from "@/i18n/LocaleContext";
import {
  DEFAULT_USD_CENTS,
  MAX_USD_CENTS,
  MIN_USD_CENTS,
  parseUsdInput,
  useFormat,
} from "../format";
import { quoteOptions, useCheckout, useQuote } from "../queries";
import { useErrorMessage, useErrorToast } from "../useErrorMessage";
import { Panel, PrimaryButton, Skeleton, Spinner } from "./ui";

const PRESETS = [10, 25, 50, 100];
// Typing "250" shouldn't price "2" and "25" on the way.
const QUOTE_DELAY_MS = 300;

const BuyCredits = () => {
  const t = useT();
  const format = useFormat();
  const errorMessage = useErrorMessage();
  const toastError = useErrorToast();
  const queryClient = useQueryClient();
  const { isSignedIn } = useAuth();
  const { pathname } = useLocation();
  const amountRef = useRef(null);
  const quoteTimer = useRef(null);

  const [amount, setAmount] = useState(String(DEFAULT_USD_CENTS / 100));
  const [quotedCents, setQuotedCents] = useState(DEFAULT_USD_CENTS);
  const [submittedInvalid, setSubmittedInvalid] = useState(false);

  const usdCents = parseUsdInput(amount);
  const quote = useQuote(quotedCents);
  const checkout = useCheckout();

  // The quote on screen may still be for the previous amount; it stays,
  // dimmed, until the new one lands instead of blinking out.
  const quoteIsCurrent =
    quote.data?.usd_cents === usdCents && !quote.isPlaceholderData;
  const poolShort = quoteIsCurrent && !quote.data.pool_can_cover;
  const redirecting = checkout.isPending || checkout.isSuccess;
  const amountInvalid =
    usdCents === null && (submittedInvalid || amount !== "");

  const choose = (text, { immediate = false } = {}) => {
    setAmount(text);
    setSubmittedInvalid(false);
    checkout.reset();
    clearTimeout(quoteTimer.current);
    const cents = parseUsdInput(text);
    if (immediate || cents === null) setQuotedCents(cents);
    else
      quoteTimer.current = setTimeout(
        () => setQuotedCents(cents),
        QUOTE_DELAY_MS,
      );
  };

  const prefetch = (dollars) =>
    queryClient.prefetchQuery(quoteOptions(dollars * 100));

  // The button stays enabled: a click with something missing says what and
  // moves focus there, where a greyed-out button would only leave people guessing.
  const submit = (event) => {
    event.preventDefault();
    if (usdCents === null) {
      setSubmittedInvalid(true);
      amountRef.current?.focus();
      return;
    }
    checkout.mutate(
      { usdCents, here: `${window.location.origin}${pathname}` },
      // A toast, not a line under the button: the form must not move.
      { onError: toastError },
    );
  };

  const rangeText = t("aiDashboard.buy.range")
    .replace("{min}", format.usd(MIN_USD_CENTS))
    .replace("{max}", format.usd(MAX_USD_CENTS));

  return (
    <Panel title={t("aiDashboard.buy.title")}>
      <form onSubmit={submit} noValidate>
        <fieldset>
          <legend className="sr-only">
            {t("aiDashboard.buy.amountLabel")}
          </legend>
          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map((dollars) => {
              const active = amount === String(dollars);
              return (
                <button
                  key={dollars}
                  type="button"
                  onClick={() => choose(String(dollars), { immediate: true })}
                  onPointerEnter={() => prefetch(dollars)}
                  onFocus={() => prefetch(dollars)}
                  aria-pressed={active}
                  className={`min-h-11 cursor-pointer rounded-2xl border text-[0.875rem] tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy ${
                    active
                      ? "border-navy bg-navy text-surface"
                      : "border-hairline text-ink hover:border-navy"
                  }`}
                >
                  {format.usd(dollars * 100)}
                </button>
              );
            })}
          </div>
        </fieldset>

        <label className="sr-only" htmlFor="ai-amount">
          {t("aiDashboard.buy.amountLabel")}
        </label>
        <div
          className={`mt-3 flex items-center gap-2 rounded-2xl border px-4 transition-colors focus-within:border-navy ${
            amountInvalid ? "border-red-400" : "border-hairline"
          }`}
        >
          <span className="text-muted">$</span>
          <input
            ref={amountRef}
            id="ai-amount"
            inputMode="numeric"
            autoComplete="off"
            dir="ltr"
            value={amount}
            aria-invalid={amountInvalid}
            aria-describedby={amountInvalid ? "ai-amount-hint" : undefined}
            onChange={(e) =>
              choose(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            className="min-h-11 w-full bg-transparent text-base tabular-nums text-ink outline-none"
          />
        </div>
        <div
          className="mt-5 rounded-2xl bg-canvas px-4 py-4"
          aria-live="polite"
        >
          <p className="text-xs uppercase tracking-[0.14em] text-muted">
            {t("aiDashboard.buy.youGet")}
          </p>
          {/* One fixed-height slot for the figure and anything that stands in
              for it, so no message ever pushes the form down. */}
          <div className="mt-1 flex h-8 items-center text-xs leading-4">
            {amountInvalid ? (
              <p id="ai-amount-hint" className="text-red-600">
                {rangeText}
              </p>
            ) : usdCents === null ? (
              <p className="text-2xl font-extralight text-muted">—</p>
            ) : poolShort ? (
              <p className="text-amber-800">
                {t("aiDashboard.errors.insufficient_liquidity")}
              </p>
            ) : quote.data ? (
              <p
                className={`text-2xl font-extralight tabular-nums text-ink transition-opacity ${
                  quoteIsCurrent ? "opacity-100" : "opacity-40"
                }`}
              >
                ≈ {format.credits(quote.data.credits_e8s)}{" "}
                <span className="text-sm text-muted">
                  {t("aiDashboard.buy.creditsUnit")}
                </span>
              </p>
            ) : quote.error ? (
              <p className="text-red-600">{errorMessage(quote.error)}</p>
            ) : (
              <Skeleton className="h-6 w-40" />
            )}
          </div>
        </div>

        <PrimaryButton
          type="submit"
          className="mt-6 w-full"
          disabled={!isSignedIn || redirecting || poolShort}
        >
          {redirecting ? (
            <>
              <Spinner light />
              {t("aiDashboard.buy.redirecting")}
            </>
          ) : (
            t("aiDashboard.buy.submit").replace(
              "{amount}",
              usdCents ? format.usd(usdCents) : "",
            )
          )}
        </PrimaryButton>
      </form>
    </Panel>
  );
};

export default BuyCredits;
