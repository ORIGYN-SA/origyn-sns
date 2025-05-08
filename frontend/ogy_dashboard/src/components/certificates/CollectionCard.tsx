import { LoaderSpin, Skeleton } from "@components/ui";
import {
  ChevronRightIcon,
  Square3Stack3DIcon,
} from "@heroicons/react/20/solid";

interface CollectionCardProps {
  name: string;
  canisterId: string;
  nftCount?: number;
  imageUrl?: string;
  isLoading?: boolean;
}

export const CollectionCard = ({
  name,
  nftCount,
  canisterId,
  imageUrl,
  isLoading = false,
}: CollectionCardProps) => {
  if (isLoading) {
    return (
      <div className="rounded-xl overflow-hidden bg-surface-2 w-full aspect-[4/3]">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  return (
    <div className="group cursor-pointer bg-surface p-6 rounded-xl border border-border relative overflow-hidden">
      <div className="rounded-xl overflow-hidden w-full aspect-[4/3] relative">
        <img
          src={imageUrl}
          alt={name}
          className={`w-full h-full object-contain ${
            imageUrl?.includes("col_placeholder_logo")
              ? "object-cover"
              : "object-contain"
          }`}
        />
      </div>
      <div className="mt-3 space-y-2">
        <h3 className="text-md font-medium text-text-primary truncate">
          {name}
        </h3>
        {nftCount !== undefined && (
          <p className="text-sm text-text-secondary flex items-center gap-1">
            <Square3Stack3DIcon className="h-4 w-4" /> {nftCount} certificate
            {nftCount !== 1 ? "s" : ""}
          </p>
        )}
      </div>
      <a
        href={`https://${canisterId}.raw.icp0.io/collection/info`}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-0 left-0 w-full h-10 bg-gray-50 text-black text-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-full group-hover:translate-y-0"
      >
        {canisterId}
        <ChevronRightIcon className="h-4 w-4 ml-1" />
      </a>
    </div>
  );
};

CollectionCard.Skeleton = () => {
  return (
    <div className="group cursor-pointer bg-surface p-6 rounded-xl border border-border relative overflow-hidden">
      <div className="rounded-xl overflow-hidden w-full aspect-[4/3] relative">
        <div className="relative w-full h-full">
          <div className="w-full h-full bg-surface-2 flex items-center justify-center">
            <LoaderSpin />
          </div>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <Skeleton className="w-24 h-4" />
        <Skeleton className="w-12 h-2" />
      </div>
    </div>
  );
};
