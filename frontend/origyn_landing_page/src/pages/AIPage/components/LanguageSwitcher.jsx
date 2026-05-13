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
    <div
      className="inline-flex items-center rounded-full bg-black/[0.04] p-1"
      role="group"
      aria-label="Language"
    >
      {LANGUAGES.map((lang) => {
        const isActive = active === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => setActive(lang.code)}
            aria-pressed={isActive}
            className={`cursor-pointer rounded-full px-3 py-1 text-[0.8125rem] tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy ${
              isActive
                ? "bg-black/[0.08] text-ink"
                : "text-muted hover:text-ink"
            }`}
          >
            {lang.label}
          </button>
        );
      })}
    </div>
  );
};

export default LanguageSwitcher;
