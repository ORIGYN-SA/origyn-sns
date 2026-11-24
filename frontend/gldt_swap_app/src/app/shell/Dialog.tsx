import { ReactNode, useEffect } from "react";

import { Chevron, Close } from "../icons";

/** The design's dialog: a dimmed backdrop and a centered panel (a bottom sheet on phones), with a
 * title row and a close button. Escape and a click outside close it. */
export const Dialog = ({
  label,
  title,
  onBack,
  size,
  onClose,
  children,
}: {
  /** The accessible name, and the visible title unless `title` says otherwise. */
  label: string;
  /** The visible title; null shows none. */
  title?: ReactNode | null;
  /** Shows the back arrow in place of the title. */
  onBack?: () => void;
  size?: "xs" | "sm" | "md" | "xxl";
  onClose: () => void;
  children: ReactNode;
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="d1">
      <div className="d1b" />
      <div className="d1p" onClick={onClose}>
        <div
          className={`dlg ${size ?? ""}`}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="dh">
            {onBack ? (
              <div className="dhl">
                <div className="ib" role="button" aria-label="Back" onClick={onBack}>
                  <Chevron className="rot90" width={24} height={24} />
                </div>
              </div>
            ) : (
              title !== null && (
                <div className="dhl">
                  <h2 className="dht">{title ?? label}</h2>
                </div>
              )
            )}
            <div className="dhr">
              <button type="button" className="dcl" aria-label="Close" onClick={onClose}>
                <div className="ib">
                  <Close width={18} height={18} />
                </div>
              </button>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

/** A dialog's working, failed and finished states, as the design draws them. */
export const Pending = ({ label }: { label: string }) => (
  <div className="w-pend">
    <div className="w-mb16">
      <div className="stbox">
        <div className="spin" />
      </div>
    </div>
    <div>{label}</div>
    <div className="gold">in progress...</div>
  </div>
);
