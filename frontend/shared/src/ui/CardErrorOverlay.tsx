import { ReactNode } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

type CardErrorOverlayProps = {
  title: ReactNode;
  description?: ReactNode;
};

const DEFAULT_DESCRIPTION = (
  <>
    We hit an issue fetching this metric.
    <br />
    Please try again in a moment.
  </>
);

const CardErrorOverlay = ({
  title,
  description = DEFAULT_DESCRIPTION,
}: CardErrorOverlayProps) => (
  <div
    data-skel-static
    role="alert"
    className="absolute inset-0 z-10 flex items-center justify-center rounded-xl border border-border-strong bg-surface/85 backdrop-blur-sm px-6 select-text"
  >
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-surface-2 border border-border">
        <ExclamationTriangleIcon className="w-6 h-6 text-muted" />
      </div>
      <div className="flex flex-col gap-1">
        <h4 className="text-content text-base">
          Couldn't load <strong className="font-bold">{title}</strong>
        </h4>
        <p className="text-sm text-muted">{description}</p>
      </div>
    </div>
  </div>
);

export default CardErrorOverlay;
