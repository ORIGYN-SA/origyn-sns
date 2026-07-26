import { memo } from "react";
import { Link } from "react-router-dom";
import { useLocalePath, useT } from "@i18n/LocaleContext";
import useCollectionCover from "@hooks/nft/useCollectionCover";
import { EXPLORER_TILE_CLASSES, NftImage, OgyBadge } from "./NftCards";

export interface CollectionCardData {
  canister_id: string;
  name: string | null;
  symbol: string | null;
  logo: string | null;
  total_tokens: number;
  distinct_holders?: number;
  is_ai?: boolean;
}

const CountPill = ({ value, label }: { value: number; label: string }) => (
  <span className="inline-flex items-center rounded-full border border-border-faint bg-surface-muted px-2 py-1 text-muted font-normal text-explorer-label leading-none">
    {value} {label}
  </span>
);

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
      to={lp(`/viewer/collections/${collection.canister_id}`)}
      className={EXPLORER_TILE_CLASSES.collectionFrame}
    >
      <div className={EXPLORER_TILE_CLASSES.image}>
        <NftImage
          src={cover}
          alt={collection.name ?? collection.canister_id}
          className={EXPLORER_TILE_CLASSES.imageMedia}
        />
        <div className="absolute top-2 end-2">
          <OgyBadge />
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-between px-1">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <div
              className={`${EXPLORER_TILE_CLASSES.meta} text-muted truncate`}
            >
              {collection.symbol ?? t("explorer.sections.collections")}
            </div>
            {collection.is_ai && (
              <span className="shrink-0 rounded-full border border-border-faint bg-surface-muted px-1.5 py-0.5 text-explorer-label font-medium uppercase leading-none text-muted">
                {t("explorer.collections.ai")}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-explorer-card-title leading-snug text-content truncate">
            {collection.name ?? collection.canister_id}
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <CountPill
            value={collection.total_tokens}
            label={t.plural(
              "explorer.collections.items",
              collection.total_tokens
            )}
          />
          {collection.distinct_holders !== undefined && (
            <CountPill
              value={collection.distinct_holders}
              label={t.plural(
                "explorer.collections.holders",
                collection.distinct_holders
              )}
            />
          )}
        </div>
      </div>
    </Link>
  );
});

export default CollectionCard;
