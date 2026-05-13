import { useState } from "react";

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
  { code: "de", label: "DE" },
  { code: "it", label: "IT" },
  { code: "zh", label: "中文" },
];

const LanguageSwitcher = () => {
  const [active, setActive] = useState("en");

  return (
    <div className="relative inline-flex items-center">
      <select
        value={active}
        onChange={(e) => setActive(e.target.value)}
        aria-label="Language"
        className="cursor-pointer appearance-none rounded-full bg-black/[0.04] py-1.5 pl-4 pr-9 text-[0.8125rem] tracking-wide text-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
};

export default LanguageSwitcher;
