import { useState } from "react";
import { useT } from "@/i18n/LocaleContext";
import { CREDITS_URL } from "../api";
import { PrimaryButton, SecondaryButton } from "./ui";

const CopyButton = ({ text }) => {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2_000);
  };
  return (
    <SecondaryButton
      onClick={copy}
      aria-live="polite"
      className="min-w-28 bg-surface"
    >
      {copied
        ? `✓ ${t("aiDashboard.keys.copied")}`
        : t("aiDashboard.keys.copy")}
    </SecondaryButton>
  );
};

// The gateway shows a new key once and keeps only its hash. A modal keeps
// the user on it until they choose to leave, and the request beside it shows
// what to do with the key next.
const NewKeyDialog = ({ apiKey, onClose }) => {
  const t = useT();
  const example = `curl ${CREDITS_URL}/balance \\\n  -H "Authorization: Bearer ${apiKey}"`;

  return (
    <dialog
      ref={(node) => {
        if (node && !node.open) node.showModal();
      }}
      onClose={onClose}
      aria-labelledby="ai-new-key-title"
      className="m-auto w-[min(36rem,calc(100vw-2rem))] rounded-3xl border border-[#ececec] bg-surface p-0 text-start text-ink shadow-2xl backdrop:bg-navy/40 backdrop:backdrop-blur-sm"
    >
      <div className="p-6 md:p-8">
        <h2
          id="ai-new-key-title"
          className="text-xl font-medium tracking-tight"
        >
          {t("aiDashboard.keys.newTitle")}
        </h2>
        <p className="mt-2 text-sm text-muted">
          {t("aiDashboard.keys.newWarning")}
        </p>

        <div className="mt-5 flex items-center gap-2 rounded-2xl border border-hairline bg-canvas p-2 ps-4">
          <code
            dir="ltr"
            className="min-w-0 flex-1 select-all break-all font-mono text-[0.8125rem]"
          >
            {apiKey}
          </code>
          <CopyButton text={apiKey} />
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="text-sm text-muted">{t("aiDashboard.keys.tryIt")}</p>
          <CopyButton text={example} />
        </div>
        <pre
          dir="ltr"
          className="mt-2 overflow-x-auto rounded-2xl bg-navy p-4 font-mono text-[0.75rem] leading-relaxed text-white/90"
        >
          {example}
        </pre>

        <div className="mt-6 flex justify-end">
          <form method="dialog">
            <PrimaryButton type="submit" autoFocus>
              {t("aiDashboard.keys.saved")}
            </PrimaryButton>
          </form>
        </div>
      </div>
    </dialog>
  );
};

export default NewKeyDialog;
