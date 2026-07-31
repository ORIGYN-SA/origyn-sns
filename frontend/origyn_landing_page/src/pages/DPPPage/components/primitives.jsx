import RichText from "@/i18n/RichText";

export const Section = ({ id, children, className = "" }) => (
  <section id={id} className={`px-6 py-16 md:px-10 md:py-24 ${className}`}>
    <div className="mx-auto w-full max-w-[1120px]">{children}</div>
  </section>
);

export const Lines = ({ text }) =>
  String(text ?? "")
    .split("\n")
    .map((line, i) => (
      <span key={i} className="block">
        <RichText text={line} />
      </span>
    ));

export const SectionHeader = ({ title, lead, className = "" }) => (
  <div className={className}>
    <h2 className="max-w-[720px] text-balance text-[1.75rem] font-light leading-[1.2] tracking-tight text-ink md:text-[2.5rem]">
      <Lines text={title} />
    </h2>
    {lead ? (
      <p className="mt-5 max-w-[620px] text-[0.9375rem] leading-[1.7] text-ink/70 md:text-base">
        {lead}
      </p>
    ) : null}
  </div>
);

export const GradientRule = ({ className = "" }) => (
  <div
    aria-hidden="true"
    className={`mx-auto h-px w-full max-w-[420px] bg-brand-gradient [mask-image:linear-gradient(to_right,transparent,#000_20%,#000_80%,transparent)] ${className}`}
  />
);

// Use a named size because Tailwind emits .h-7 after .h-6. An appended h-6
// loses the specificity tie, so each class string must contain one size.
const MARK_SIZES = {
  sm: { box: "h-5 w-5", icon: "h-2.5 w-2.5" },
  md: { box: "h-6 w-6", icon: "h-3 w-3" },
  lg: { box: "h-7 w-7", icon: "h-3.5 w-3.5" },
};

export const CheckMark = ({
  size = "lg",
  className = "",
  ring = "bg-brand-gradient",
  innerClassName = "bg-white",
  iconClassName = "text-ink",
}) => {
  const { box, icon } = MARK_SIZES[size] ?? MARK_SIZES.lg;
  return (
    <span
      className={`inline-flex ${box} shrink-0 rounded-full ${ring} p-px ${className}`}
    >
      <span
        className={`flex h-full w-full items-center justify-center rounded-full ${innerClassName}`}
      >
        <svg
          viewBox="0 0 12 12"
          className={`${icon} ${iconClassName}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M1.5 6.25 4.5 9.25 10.5 2.75" />
        </svg>
      </span>
    </span>
  );
};

export const CrossMark = ({ size = "lg", className = "" }) => {
  const { box, icon } = MARK_SIZES[size] ?? MARK_SIZES.lg;
  return (
    <span
      className={`inline-flex ${box} shrink-0 items-center justify-center rounded-full border border-hairline ${className}`}
    >
      <svg
        viewBox="0 0 12 12"
        className={`${icon} text-ink/40`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d="M3 3 9 9M9 3 3 9" />
      </svg>
    </span>
  );
};

const NUMBER_SIZES = {
  md: { box: "h-9 w-9", text: "text-[0.8125rem]" },
  lg: { box: "h-11 w-11", text: "text-[0.9375rem]" },
};

export const RingNumber = ({
  children,
  size = "lg",
  ringClassName = "bg-brand-gradient p-px",
  innerClassName = "bg-white",
  textClassName = "text-ink",
  className = "",
}) => {
  const { box, text } = NUMBER_SIZES[size] ?? NUMBER_SIZES.lg;
  return (
    <span
      className={`inline-flex ${box} shrink-0 rounded-full ${ringClassName} ${className}`}
    >
      <span
        className={`flex h-full w-full items-center justify-center rounded-full ${innerClassName}`}
      >
        <span className={`italic leading-none ${text} ${textClassName}`}>
          {children}
        </span>
      </span>
    </span>
  );
};
