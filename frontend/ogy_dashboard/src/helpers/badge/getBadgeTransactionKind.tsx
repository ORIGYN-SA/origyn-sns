import { ReactNode } from "react";
import {
  CheckIcon,
  ArrowsRightLeftIcon,
  FireIcon,
  CursorArrowRaysIcon,
} from "@heroicons/react/24/outline";

// eslint-disable-next-line react-refresh/only-export-components
const Badge = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={`rounded-full font-semibold px-4 py-1 text-sm text-black flex items-center justify-center gap-2 ${className}`}
    >
      {children}
    </div>
  );
};

const getBadgeTransactionKind = (kind: string) => {
  switch (kind) {
    case "mint":
      return (
        <Badge className="bg-teal-100">
          <CursorArrowRaysIcon className="h-4 w-4" />
          <div>Mint</div>
        </Badge>
      );
    case "approve":
      return (
        <Badge className="bg-amber-100">
          <CheckIcon className="h-4 w-4" />
          <div>Approve</div>
        </Badge>
      );
    case "burn":
      return (
        <Badge className="bg-orange-100">
          <FireIcon className="h-4 w-4" />
          <div>Burn</div>
        </Badge>
      );
    case "transfer":
      return (
        <Badge className="bg-indigo-100">
          <ArrowsRightLeftIcon className="h-4 w-4" />
          <div>Transfer</div>
        </Badge>
      );
    default:
      null;
  }
};

export default getBadgeTransactionKind;
