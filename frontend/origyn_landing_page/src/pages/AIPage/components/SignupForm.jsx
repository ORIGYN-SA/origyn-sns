import { useRef, useState } from "react";
import { useT } from "@/i18n/LocaleContext";

const EMAIL_ENDPOINT =
  "https://calm-whale-773.eu-west-1.convex.site/subscribe";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUCCESS_FADE_MS = 8000;

const SignupForm = () => {
  const t = useT();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ type: "idle", text: "" });
  const [loading, setLoading] = useState(false);
  const fadeTimer = useRef(null);

  const showStatus = (next, fadeMs) => {
    if (fadeTimer.current) clearTimeout(fadeTimer.current);
    fadeTimer.current = null;
    setStatus(next);
    if (fadeMs) {
      fadeTimer.current = setTimeout(() => {
        setStatus({ type: "idle", text: "" });
      }, fadeMs);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_PATTERN.test(trimmed)) {
      showStatus({ type: "error", text: t("form.invalid") });
      return;
    }
    setLoading(true);
    showStatus({ type: "idle", text: "" });
    try {
      const res = await fetch(EMAIL_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      if (!res.ok) throw new Error("Request failed");
      setEmail("");
      showStatus({ type: "success", text: t("form.success") }, SUCCESS_FADE_MS);
    } catch {
      showStatus({ type: "error", text: t("form.error") });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (status.type === "error") {
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
      setStatus({ type: "idle", text: "" });
    }
  };

  const isError = status.type === "error";
  const isSuccess = status.type === "success";

  return (
    <div className="mx-auto w-full max-w-[600px]">
      <form
        onSubmit={handleSubmit}
        aria-label={t("form.label")}
        noValidate
        className="flex w-full max-w-[600px] flex-col items-stretch gap-2 rounded-3xl border border-hairline bg-surface p-2 sm:flex-row sm:items-center sm:rounded-full sm:py-1.5 sm:pl-7 sm:pr-1.5"
      >
        <input
          type="email"
          value={email}
          onChange={handleEmailChange}
          placeholder={t("form.placeholder")}
          aria-label={t("form.emailLabel")}
          aria-describedby="signup-msg"
          autoComplete="email"
          required
          className={`flex-1 border-0 bg-transparent py-3 text-base font-normal underline underline-offset-[6px] outline-none placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy ${
            isError
              ? "text-red-500 decoration-red-300"
              : "text-ink decoration-muted focus:decoration-navy"
          }`}
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full bg-navy px-6 py-3 text-[0.8125rem] font-normal text-surface transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <span
                aria-hidden="true"
                className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white"
              />
              <span className="sr-only">{t("form.submitting")}</span>
            </>
          ) : (
            t("form.submit")
          )}
        </button>
      </form>

      <div
        id="signup-msg"
        role="status"
        aria-live="polite"
        className={`mt-3 flex min-h-[1rem] items-center justify-center gap-1.5 font-mono text-[0.6875rem] tracking-[0.04em] transition-opacity duration-300 ${
          isSuccess
            ? "text-emerald-600 opacity-100"
            : isError
              ? "text-red-500 opacity-100"
              : "opacity-0"
        }`}
      >
        {isSuccess && (
          <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-emerald-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="8"
              height="8"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        )}
        <span>{status.text || " "}</span>
      </div>
    </div>
  );
};

export default SignupForm;
