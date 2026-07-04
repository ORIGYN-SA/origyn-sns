import { memo } from "react";
import { Link } from "react-router-dom";
import { useLocalePath, useT } from "@i18n/LocaleContext";
import useCollectionCover from "@hooks/nft/useCollectionCover";
import { NftImage, OgyBadge } from "./NftCards";

export interface CollectionCardData {
  canister_id: string;
  name: string | null;
  symbol: string | null;
  logo: string | null;
  total_tokens: number;
  distinct_holders?: number;
}

const CountPill = ({ value, label }: { value: number; label: string }) => (
  <span className="inline-flex items-center rounded-full border border-border-faint bg-surface-muted px-2 py-1 text-muted font-normal text-[10px] leading-none">
    {value} {label}
  </span>
);

// Follows the NftTile anatomy so collection and certificate cards read as one
// family: same frame, image area, badge and typography.
const CollectionCard = memo(function CollectionCard({
  collection,
}: {
  collection: CollectionCardData;
}) {
  const t = useT();
  const lp = useLocalePath();
  const cover = useCollectionCover(collection.canister_id, collection.logo);

  return (
    <Link
      to={lp(`/explorer/collections/${collection.canister_id}`)}
      className="w-[253px] h-[343px] rounded-xl border border-border-strong bg-surface pt-2 pe-2 pb-4 ps-2 flex flex-col gap-2.5 cursor-pointer transition-colors hover:border-content/40"
    >
      <div className="relative h-[229px] w-full">
        <NftImage
          src={cover}
          alt={collection.name ?? collection.canister_id}
          className="h-full w-full rounded-t-2xl overflow-hidden"
        />
        <div className="absolute top-2 end-2">
          <OgyBadge />
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-between px-1">
        <div className="flex flex-col gap-0.5">
          <div className="font-medium text-[11px] leading-4 tracking-[1.6px] uppercase truncate text-muted">
            {collection.symbol ?? t("explorer.sections.collections")}
          </div>
          <h3 className="font-semibold text-[15px] leading-snug text-content truncate">
            {collection.name ?? collection.canister_id}
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <CountPill
            value={collection.total_tokens}
            label={t("explorer.collections.items")}
          />
          {collection.distinct_holders !== undefined && (
            <CountPill
              value={collection.distinct_holders}
              label={t("explorer.collections.holders")}
            />
          )}
        </div>
      </div>
    </Link>
  );
});

export default CollectionCard;
