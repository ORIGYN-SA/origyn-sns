import { Link } from "react-router-dom";
import { DateTime } from "luxon";
import { useLocalePath, useT } from "@i18n/LocaleContext";
import { shortenId } from "@helpers/strings";
import useNftCollection from "@hooks/nft/useNftCollection";
import { NftCard } from "@hooks/nft/mapNft";
import { BlockchainLink, IssuerLine, NftImage } from "./NftCards";
import { DetailItem } from "./SimpleCertificateBody";

const CertificateSummary = ({ nft }: { nft: NftCard }) => {
  const t = useT();
  const lp = useLocalePath();
  const collection = useNftCollection(nft.canisterId);
  const info = collection.data;

  const collectionName = info?.name ?? nft.collectionName;
  const mintedOn = nft.mintedAtMs
    ? DateTime.fromMillis(nft.mintedAtMs).toFormat("LLL dd, yyyy")
    : null;
  const categories = info?.categories ?? [];

  return (
    <section className="mb-8 rounded-xl border border-border bg-surface p-6">
      <div className="flex flex-col sm:flex-row gap-6">
        <NftImage
          src={nft.imageUrl ?? info?.logo ?? null}
          alt={nft.name}
          className="h-collection-logo w-collection-logo shrink-0 rounded-xl overflow-hidden"
        />

        <div className="flex flex-col gap-3 min-w-0 flex-1">
          <IssuerLine issuer={nft.issuer} className="text-muted" />

          {nft.description && (
            <p className="text-sm text-muted leading-relaxed max-w-3xl">
              {nft.description}
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 border-t border-border pt-4">
            <DetailItem
              label={t("explorer.detail.tokenId")}
              value={nft.tokenId}
            />
            <DetailItem
              label={t("explorer.detail.collection")}
              value={collectionName ?? shortenId(nft.canisterId)}
              to={lp(`/viewer/collections/${nft.canisterId}`)}
            />
            {info?.symbol && (
              <DetailItem
                label={t("explorer.detail.symbol")}
                value={info.symbol}
              />
            )}
            {nft.ownerAccount && (
              <DetailItem
                label={t("explorer.detail.owner")}
                value={shortenId(nft.ownerAccount)}
                to={lp(`/viewer/collectors/${nft.ownerAccount}`)}
              />
            )}
            {mintedOn && (
              <DetailItem
                label={t("explorer.detail.mintedOn")}
                value={mintedOn}
              />
            )}
            <DetailItem
              label={t("explorer.detail.canisterId")}
              value={shortenId(nft.canisterId)}
            />
            {info && (
              <DetailItem
                label={t.plural(
                  "explorer.collections.items",
                  info.total_tokens
                )}
                value={String(info.total_tokens)}
              />
            )}
            {info && (
              <DetailItem
                label={t.plural(
                  "explorer.collections.holders",
                  info.distinct_holders
                )}
                value={String(info.distinct_holders)}
              />
            )}
          </div>

          {categories.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-border pt-4">
              <div className="text-explorer-label font-medium tracking-explorer-meta uppercase text-muted">
                {t("explorer.detail.categories")}
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Link
                    key={category}
                    to={lp(
                      `/viewer/certificates?category=${encodeURIComponent(category)}`
                    )}
                    className="rounded-full border border-border px-3 py-1 text-sm text-muted transition-colors hover:text-content"
                  >
                    {category}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-border pt-4">
            <BlockchainLink canisterId={nft.canisterId} variant="detail" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CertificateSummary;
