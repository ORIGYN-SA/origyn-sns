import { useState } from "react";
import { useLocale } from "@/i18n/LocaleContext";
import { LEAD_ENDPOINT } from "../links";
import { CheckMark, GradientRule, Section, SectionHeader } from "./primitives";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DownloadGate = () => {
  const { locale, t } = useLocale();
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const perks = t.raw("dpp.download.perks") ?? [];

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_PATTERN.test(trimmed)) {
      setError(t("dpp.download.invalid"));
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(LEAD_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          source: "dpp-onepager",
          locale,
          website,
        }),
      });
      if (!res.ok) throw new Error(`Lead request failed: ${res.status}`);
      setDone(true);
    } catch {
      setError(t("dpp.download.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Section>
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <SectionHeader
          title={t("dpp.download.title")}
          lead={t("dpp.download.lead")}
        />

        <div className="lg:pt-2">
          {done ? (
            <div className="border-t border-hairline pt-8">
              <p className="flex items-start gap-3 text-[1.0625rem] font-medium tracking-tight text-ink">
                <CheckMark size="md" className="mt-0.5" />
                {t("dpp.download.sentTitle")}
              </p>
              <p className="mt-2 max-w-[440px] ps-10 text-[0.9375rem] leading-[1.65] text-ink/70">
                {t("dpp.download.sentBody")}
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="border-t border-hairline pt-8"
            >
              <label
                htmlFor="dpp-download-email"
                className="block text-[0.8125rem] font-medium tracking-tight text-ink"
              >
                {t("dpp.download.label")}
              </label>

              {/* Honeypot. The API drops any submission that fills this in. */}
              <input
                type="text"
                name="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="pointer-events-none absolute -left-[9999px] h-0 w-0 opacity-0"
              />

              <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end">
                <input
                  id="dpp-download-email"
                  type="email"
                  value={email}
                  onChange={handleChange}
                  placeholder={t("dpp.download.placeholder")}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "dpp-download-error" : undefined}
                  className="w-full max-w-[380px] border-b border-hairline bg-transparent pb-3 text-[1.0625rem] text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-ink"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-fit shrink-0 items-center gap-3 rounded-full bg-navy px-7 py-3.5 text-[0.875rem] font-medium tracking-tight text-white transition-transform duration-200 hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60"
                >
                  {loading
                    ? t("dpp.download.sending")
                    : t("dpp.download.submit")}
                </button>
              </div>

              <p
                id="dpp-download-error"
                role={error ? "alert" : undefined}
                className="mt-3 min-h-[1.25rem] text-[0.8125rem] text-[#c2410c]"
              >
                {error}
              </p>

              {perks.length > 0 && (
                <ul className="mt-6 flex flex-wrap gap-x-7 gap-y-3">
                  {perks.map((perk) => (
                    <li
                      key={perk}
                      className="flex items-center gap-2.5 text-[0.8125rem] text-ink/70"
                    >
                      <CheckMark size="sm" />
                      {perk}
                    </li>
                  ))}
                </ul>
              )}

              <p className="mt-6 max-w-[420px] text-[0.75rem] leading-[1.6] text-ink/50">
                {t("dpp.download.privacy")}
              </p>
            </form>
          )}
        </div>
      </div>

      <GradientRule className="mt-16 md:mt-24" />
    </Section>
  );
};

export default DownloadGate;
