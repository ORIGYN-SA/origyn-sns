import { useT } from "@/i18n/LocaleContext";
import RichText from "@/i18n/RichText";
import {
  BOOK_A_CALL_URL,
  PARTNERSHIPS_EMAIL,
  PARTNERSHIPS_MAILTO,
} from "../links";
import { RingNumber } from "./primitives";

const CtaBand = () => {
  const t = useT();
  const steps = t.raw("dpp.cta.steps") ?? [];

  return (
    <section className="bg-navy px-6 py-20 md:px-10 md:py-28">
      <div className="mx-auto w-full max-w-[1120px]">
        <div className="grid items-end gap-10 lg:grid-cols-[1fr_auto]">
          <div>
            <h2 className="max-w-[680px] text-balance text-[1.875rem] font-light leading-[1.2] tracking-tight text-white md:text-[2.75rem]">
              <RichText text={t("dpp.cta.title")} />
            </h2>
            <p className="mt-5 max-w-[560px] text-[0.9375rem] leading-[1.7] text-white/70 md:text-base">
              {t("dpp.cta.lead")}
            </p>
          </div>
          <div className="flex flex-col items-start gap-4 lg:items-end">
            <a
              href={BOOK_A_CALL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex w-fit items-center gap-3 rounded-full bg-white px-8 py-4 text-[0.9375rem] font-medium tracking-tight text-navy transition-transform duration-200 hover:-translate-y-0.5"
            >
              {t("dpp.cta.button")}
              <svg
                viewBox="0 0 12 12"
                className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M1 11 11 1M4 1h7v7" />
              </svg>
            </a>
            <p className="text-[0.8125rem] leading-[1.6] text-white/60">
              {t("dpp.cta.emailPrompt")}{" "}
              <a
                href={PARTNERSHIPS_MAILTO}
                className="text-white underline underline-offset-4 transition-opacity hover:opacity-80"
              >
                {PARTNERSHIPS_EMAIL}
              </a>
            </p>
          </div>
        </div>

        <ol className="mt-16 grid gap-10 border-t border-white/15 pt-10 sm:grid-cols-3 md:mt-20 md:pt-12">
          {steps.map((s) => (
            <li key={s.step}>
              <RingNumber
                size="md"
                ringClassName="border border-white/25"
                innerClassName="bg-navy"
                textClassName="text-white"
              >
                {s.step}
              </RingNumber>
              <h3 className="mt-5 text-[1.0625rem] font-medium tracking-tight text-white">
                {s.title}
              </h3>
              <p className="mt-2 max-w-[300px] text-[0.875rem] leading-[1.65] text-white/60">
                {s.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};

export default CtaBand;
