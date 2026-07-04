import { KeyboardEvent, memo, useEffect, useState } from "react";
import { useT } from "@i18n/LocaleContext";
import { BlockchainIcon, CheckmarkCircleIcon } from "@components/ui/icons";
import { NftCard, nftBlockchainUrl } from "@hooks/nft/mapNft";

export type OnSelectNft = (nft: NftCard) => void;

export const EXPLORER_SKELETON_CLASSES = {
  tile: "w-explorer-tile h-explorer-tile rounded-xl bg-muted/20 animate-pulse",
  heroTile:
    "w-explorer-hero sm:w-explorer-hero-sm h-explorer-hero rounded-2xl bg-muted/20 animate-pulse",
  image:
    "absolute inset-0 bg-muted/20 animate-pulse pointer-events-none transition-opacity duration-300 ease-out",
  stat: "h-12 w-32 rounded-lg bg-muted/20 animate-pulse",
  collectionSummary:
    "h-collection-summary rounded-xl bg-muted/20 animate-pulse mb-12",
  certificatePill:
    "h-12 w-full max-w-certificate-skeleton-pill mx-auto rounded-full bg-muted/20 animate-pulse",
  certificateFrame:
    "h-certificate-skeleton sm:h-certificate-skeleton-sm rounded-3xl bg-muted/20 animate-pulse",
} as const;

export const EXPLORER_TILE_CLASSES = {
  frame:
    "group w-explorer-tile h-explorer-tile overflow-hidden rounded-xl border border-border-strong bg-surface pt-2 pe-2 pb-4 ps-2 flex flex-col gap-2.5 cursor-pointer focus:outline-none focus-visible:border-content/60 focus-visible:ring-2 focus-visible:ring-content/30",
  heroFrame:
    "relative w-explorer-hero sm:w-explorer-hero-sm h-explorer-hero overflow-hidden rounded-2xl border border-border-strong bg-surface group cursor-pointer focus:outline-none focus-visible:border-content/60 focus-visible:ring-2 focus-visible:ring-content/30",
  image: "relative h-explorer-tile-image w-full overflow-hidden rounded-t-2xl",
  imageMedia:
    "h-full w-full transition-transform duration-500 ease-out group-hover:scale-103",
  meta: "font-medium text-explorer-meta leading-4 tracking-explorer-meta uppercase truncate",
  skeleton: EXPLORER_SKELETON_CLASSES.tile,
};

const clickableCardProps = (onClick: () => void) => ({
  role: "button" as const,
  tabIndex: 0,
  onClick,
  onKeyDown: (event: KeyboardEvent) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  },
});

export const OgyBadge = ({ size = 30 }: { size?: number }) => (
  <div
    aria-label="OGY"
    style={{ height: size, width: size }}
    className="rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-ogy-badge pointer-events-none"
  >
    <img
      src="/ogy_logo.svg"
      alt=""
      style={{ height: size / 2, width: size / 2 }}
    />
  </div>
);

const NoImageIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="h-no-image-icon max-h-10 w-auto"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
);

const NoImagePlaceholder = ({ className }: { className?: string }) => {
  const t = useT();
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 bg-surface-2 text-muted ${
        className ?? ""
      }`}
    >
      <NoImageIcon />
      <span className="text-explorer-meta font-medium leading-none tracking-wide">
        {t("explorer.noImage")}
      </span>
    </div>
  );
};

export const NftImage = ({
  src,
  alt,
  className,
  fit = "cover",
}: {
  src: string | null;
  alt: string;
  className?: string;
  fit?: "cover" | "contain";
}) => {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [src]);

  if (!src || failed) {
    return <NoImagePlaceholder className={className} />;
  }

  const skeletonVisibility = loaded ? "opacity-0" : "opacity-100";
  const imageVisibility = loaded ? "opacity-100" : "opacity-0";

  if (fit === "contain") {
    return (
      <div
        className={`relative overflow-hidden bg-surface-2 ${className ?? ""}`}
      >
        <div
          className={`${EXPLORER_SKELETON_CLASSES.image} ${skeletonVisibility}`}
        />
        <img
          src={src}
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          className={`absolute inset-0 h-full w-full object-cover blur-2xl scale-110 transition-opacity duration-200 ${
            loaded ? "opacity-60" : "opacity-0"
          }`}
        />
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`relative h-full w-full object-contain transition-opacity duration-200 ${imageVisibility}`}
        />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-surface-2 ${className ?? ""}`}>
      <div
        className={`${EXPLORER_SKELETON_CLASSES.image} ${skeletonVisibility}`}
      />
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${imageVisibility}`}
      />
    </div>
  );
};

const BLOCKCHAIN_LINK_VARIANTS = {
  tile: {
    link: "gap-1 border border-border-faint bg-surface-muted px-2 py-1 text-muted hover:bg-surface-2",
    text: "font-normal text-explorer-label",
    icon: 12,
  },
  hero: {
    link: "gap-1.5 bg-white/15 backdrop-blur-md px-3 py-1.5 text-white hover:bg-white/25",
    text: "font-medium text-explorer-meta",
    icon: 12,
  },
  detail: {
    link: "gap-2 border border-border-faint bg-surface-muted px-4 py-2.5 text-muted hover:bg-surface-2",
    text: "font-medium text-explorer-link-detail",
    icon: 16,
  },
};

export const BlockchainLink = ({
  canisterId,
  variant,
}: {
  canisterId: string;
  variant: keyof typeof BLOCKCHAIN_LINK_VARIANTS;
}) => {
  const t = useT();
  const classes = BLOCKCHAIN_LINK_VARIANTS[variant];

  return (
    <a
      href={nftBlockchainUrl(canisterId)}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      className={`inline-flex items-center self-start rounded-full transition-colors ${classes.link}`}
    >
      <BlockchainIcon width={classes.icon} height={classes.icon} />
      <span className={`leading-none ${classes.text}`}>
        {t("explorer.checkOnBlockchain")}
      </span>
    </a>
  );
};

export const IssuerLine = ({
  issuer,
  className,
}: {
  issuer: string | null;
  className?: string;
}) => {
  const t = useT();
  return (
    <div className={`flex items-center gap-1 ${className ?? ""}`}>
      <span className={EXPLORER_TILE_CLASSES.meta}>
        {issuer ?? t("explorer.unknownIssuer")}
      </span>
      <CheckmarkCircleIcon />
    </div>
  );
};

export const NftTile = memo(function NftTile({
  nft,
  onSelect,
}: {
  nft: NftCard;
  onSelect: OnSelectNft;
}) {
  return (
    <div
      {...clickableCardProps(() => onSelect(nft))}
      className={EXPLORER_TILE_CLASSES.frame}
    >
      <div className={EXPLORER_TILE_CLASSES.image}>
        <NftImage
          src={nft.imageUrl}
          alt={nft.name}
          className={EXPLORER_TILE_CLASSES.imageMedia}
        />
        <div className="absolute top-2 end-2">
          <OgyBadge />
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-between px-1">
        <div className="flex flex-col gap-0.5">
          <IssuerLine issuer={nft.issuer} className="text-muted" />
          <h3 className="font-semibold text-explorer-card-title leading-snug text-content truncate">
            {nft.name}
          </h3>
        </div>
        <BlockchainLink canisterId={nft.canisterId} variant="tile" />
      </div>
    </div>
  );
});

export const NftHeroTile = memo(function NftHeroTile({
  nft,
  onSelect,
}: {
  nft: NftCard;
  onSelect: OnSelectNft;
}) {
  return (
    <div
      {...clickableCardProps(() => onSelect(nft))}
      className={EXPLORER_TILE_CLASSES.heroFrame}
    >
      <NftImage
        src={nft.imageUrl}
        alt={nft.name}
        fit="contain"
        className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-103"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      <div className="absolute top-3 end-3">
        <OgyBadge size={36} />
      </div>
      <div className="absolute bottom-0 start-0 end-0 p-5 flex flex-col gap-2">
        <IssuerLine issuer={nft.issuer} className="text-white/80" />
        <h3 className="font-extrabold text-explorer-hero-title sm:text-explorer-hero-title-sm leading-tight tracking-explorer-hero text-white line-clamp-2">
          {nft.name}
        </h3>
        <div className="mt-1">
          <BlockchainLink canisterId={nft.canisterId} variant="hero" />
        </div>
      </div>
    </div>
  );
});

export const SkeletonTile = ({ hero = false }: { hero?: boolean }) => (
  <div
    className={
      hero
        ? EXPLORER_SKELETON_CLASSES.heroTile
        : EXPLORER_TILE_CLASSES.skeleton
    }
  />
);
