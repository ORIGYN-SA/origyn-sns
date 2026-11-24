import { ReactNode, useEffect } from "react";

import { Close } from "../icons";

/** The design's dialog: a dimmed backdrop and a centered panel (a bottom sheet on phones), with a
 * title row and a close button. Escape and a click outside close it. */
export const Dialog = ({
  label,
  title,
  size,
  onClose,
  children,
}: {
  /** The accessible name, and the visible title unless `title` is given. */
  label: string;
  title?: ReactNode;
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
            <div className="dhl">
              <h2 className="dht">{title ?? label}</h2>
            </div>
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
