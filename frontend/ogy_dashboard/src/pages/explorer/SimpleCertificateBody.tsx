import { useState } from "react";
import { Link } from "react-router-dom";
import { useT } from "@i18n/LocaleContext";
import { NftCard } from "@hooks/nft/mapNft";
import { IssuerLine, NftImage, OgyBadge } from "./NftCards";

export const DetailItem = ({
  label,
  value,
  to,
}: {
  label: string;
  value: string;
  to?: string;
}) => (
  <div className="flex flex-col gap-1 min-w-0">
    <div className="text-explorer-label font-medium tracking-explorer-meta uppercase text-muted">
      {label}
    </div>
    {to ? (
      <Link
        to={to}
        className="text-sm text-content truncate hover:underline"
        title={value}
      >
        {value}
      </Link>
    ) : (
      <div className="text-sm text-content truncate" title={value}>
        {value}
      </div>
    )}
  </div>
);

const SimpleCertificateBody = ({
  nft,
  collectionName,
}: {
  nft: NftCard;
  collectionName?: string | null;
}) => {
  const t = useT();
  const [activeImage, setActiveImage] = useState<string | null>(null);

  const images = [nft.imageUrl, ...nft.gallery].filter(
    (src): src is string => src !== null
  );
  const mainImage = activeImage ?? images[0] ?? null;

  return (
    <div className="flex flex-col">
      <div className="relative">
        <NftImage
          src={mainImage}
          alt={nft.name}
          className="w-full h-explorer-certificate-image sm:h-explorer-certificate-image-sm rounded-xl"
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
          <h2 className="font-extrabold text-2xl sm:text-3xl leading-tight tracking-explorer-hero text-content">
            {nft.name}
          </h2>
          {collectionName && (
            <p className="text-sm text-muted">{collectionName}</p>
          )}
        </div>

        {nft.description && (
          <p className="text-sm text-muted leading-relaxed">
            {nft.description}
          </p>
        )}

        <span className="text-explorer-label font-light tracking-explorer-fine uppercase text-muted">
          {t("explorer.detail.poweredBy")}
        </span>
      </div>
    </div>
  );
};

export default SimpleCertificateBody;
