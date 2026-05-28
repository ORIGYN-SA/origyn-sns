import { useState } from "react";
import { createPortal } from "react-dom";
import { useT } from "@/i18n/LocaleContext";
import styles from "./ContractAddressPill.module.scss";

const contractAddressValue = "lkwrt-vyaaa-aaaaq-aadhq-cai";

const ContractAddressPill = () => {
  const t = useT();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(contractAddressValue).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <>
      {createPortal(
        <div className={`${styles.copyToast} ${copied ? styles.copyToastVisible : ""}`}>
          {t("token.address.copied")}
        </div>,
        document.body
      )}
      <div className={styles.contractAddressPill}>
        <div className={styles.contractAddressText}>
          <span className={styles.contractAddressLabel}>{t("token.address.contractLabel")}</span>
          <span className={styles.contractAddressValue}>{contractAddressValue}</span>
        </div>
        <button
          onClick={handleCopy}
          className={styles.contractAddressCopy}
          aria-label={t("token.address.copyAria")}
        >
          <img src="/token/copy.svg" alt="" />
        </button>
      </div>
    </>
  );
};

export default ContractAddressPill;
