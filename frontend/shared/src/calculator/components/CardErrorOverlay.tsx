import { ReactNode } from "react";

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

// Inline copy of heroicons' ExclamationTriangleIcon so the shared package
// doesn't need @heroicons/react as a dependency.
const ExclamationTriangleIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
    />
  </svg>
);

const isRounded = (radius: string) =>
  !!radius && radius !== "0px" && radius !== "0%";

// Copy the visual container's border-radius onto the overlay so it always
// matches its surroundings: the parent if it's rounded, otherwise the first
// rounded sibling.
const adoptBorderRadius = (node: HTMLDivElement | null) => {
  if (!node) return;
  const parent = node.parentElement;
  if (!parent) return;

  const parentRadius = getComputedStyle(parent).borderRadius;
  if (isRounded(parentRadius)) {
    node.style.borderRadius = parentRadius;
    return;
  }
  for (const sibling of Array.from(parent.children)) {
    if (sibling === node) continue;
    const siblingRadius = getComputedStyle(sibling as Element).borderRadius;
    if (isRounded(siblingRadius)) {
      node.style.borderRadius = siblingRadius;
      return;
    }
  }
};

const CardErrorOverlay = ({
  title,
  description = DEFAULT_DESCRIPTION,
}: CardErrorOverlayProps) => (
  <div
    ref={adoptBorderRadius}
    data-skel-static
    role="alert"
    className="absolute inset-0 z-10 flex items-center justify-center border border-border-strong bg-surface/85 backdrop-blur-sm px-6 select-text"
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
