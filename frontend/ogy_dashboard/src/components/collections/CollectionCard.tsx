type CollectionCardProps = {
  name: string;
  canisterId: string;
  nftCount?: number;
  imageUrl?: string;
};

export const CollectionCard = ({
  name,
  canisterId,
  nftCount,
  imageUrl,
}: CollectionCardProps) => {
  return (
    <div className="bg-surface-2 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-200">
      <div className="aspect-square w-full relative">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-surface-3 flex items-center justify-center">
            <span className="text-2xl">🖼️</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">{name}</h3>
          {nftCount !== undefined && (
            <span className="text-sm text-text-secondary">{nftCount} NFTs</span>
          )}
        </div>
        <p className="text-sm text-text-secondary mt-1 truncate">
          {canisterId}
        </p>
      </div>
    </div>
  );
};
