import { useState } from "react";
import { DateTime } from "luxon";
import { useT } from "@i18n/LocaleContext";
import { shortenId } from "@helpers/strings";
import { NftCard } from "@hooks/nft/mapNft";
import { BlockchainLink, IssuerLine, NftImage, OgyBadge } from "./NftCards";

const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-1 min-w-0">
    <div className="text-[10px] font-medium tracking-[1.6px] uppercase text-muted">
      {label}
    </div>
    <div className="text-sm text-content truncate" title={value}>
      {value}
    </div>
  </div>
);

// Fallback certificate view for collections without a Minting Studio template.
const SimpleCertificateBody = ({ nft }: { nft: NftCard }) => {
  const t = useT();
  const [activeImage, setActiveImage] = useState<string | null>(null);

  const images = [nft.imageUrl, ...nft.gallery].filter(
    (src): src is string => src !== null
  );
  const mainImage = activeImage ?? images[0] ?? null;
  const mintedOn = nft.mintedAtMs
    ? DateTime.fromMillis(nft.mintedAtMs).toFormat("LLL dd, yyyy")
    : null;

  return (
    <div className="flex flex-col">
      <div className="relative">
        <NftImage
          src={mainImage}
          alt={nft.name}
          className="w-full h-[320px] sm:h-[380px] rounded-t-xl"
        />
        <div className="absolute top-3 start-3">
          <OgyBadge size={36} />
        </div>
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 px-6 pt-4 overflow-x-auto">
          {images.map((src) => (
            <button
              key={src}
              type="button"
              onClick={() => setActiveImage(src)}
              className={`shrink-0 h-14 w-14 rounded-lg overflow-hidden border transition-colors ${
                src === mainImage
                  ? "border-content"
                  : "border-border hover:border-border-strong"
              }`}
            >
              <img
                src={src}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-4 p-6">
        <div className="flex flex-col gap-1">
          <IssuerLine issuer={nft.issuer} className="text-muted" />
          <h2 className="font-extrabold text-2xl sm:text-3xl leading-tight tracking-[-0.02em] text-content">
            {nft.name}
          </h2>
        </div>

        {nft.description && (
          <p className="text-sm text-muted leading-relaxed">
            {nft.description}
          </p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-border pt-4">
          <DetailItem
            label={t("explorer.detail.tokenId")}
            value={nft.tokenId}
          />
          {mintedOn && (
            <DetailItem
              label={t("explorer.detail.mintedOn")}
              value={mintedOn}
            />
          )}
          <DetailItem
            label={t("explorer.detail.collection")}
            value={shortenId(nft.canisterId)}
          />
          {nft.ownerAccount && (
            <DetailItem
              label={t("explorer.detail.owner")}
              value={shortenId(nft.ownerAccount)}
            />
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <BlockchainLink canisterId={nft.canisterId} variant="detail" />
          <span className="text-[10px] font-light tracking-[2px] uppercase text-muted">
            {t("explorer.detail.poweredBy")}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SimpleCertificateBody;
