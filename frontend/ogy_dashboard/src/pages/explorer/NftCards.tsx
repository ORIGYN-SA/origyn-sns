import { KeyboardEvent, memo, useState } from "react";
import { useT } from "@i18n/LocaleContext";
import { BlockchainIcon, CheckmarkCircleIcon } from "@components/ui/icons";
import { NftCard, nftBlockchainUrl } from "@hooks/nft/mapNft";

export type OnSelectNft = (nft: NftCard) => void;

// Cards contain a nested link, so they are clickable divs instead of buttons.
const clickableCardProps = (onClick: () => void) => ({
  role: "button" as const,
  tabIndex: 0,
  onClick,
  onKeyDown: (event: KeyboardEvent) => {
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
    className="rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-[inset_0.75px_0.75px_0_rgba(255,255,255,0.45),inset_-0.75px_-0.75px_0_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.18)] pointer-events-none"
  >
    <img
      src="/ogy_logo.svg"
      alt=""
      style={{ height: size / 2, width: size / 2 }}
    />
  </div>
);

// fit="contain" shows the full photo over a blurred copy of itself, for wide
// frames where object-cover would crop the artwork (the featured heroes).
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

  if (!src || failed) {
    return <div className={`bg-surface-2 ${className ?? ""}`} />;
  }

  if (fit === "contain") {
    return (
      <div
        className={`relative overflow-hidden bg-surface-2 ${className ?? ""}`}
      >
        <img
          src={src}
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover blur-2xl scale-110 opacity-60"
        />
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="relative h-full w-full object-contain"
        />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={`object-cover ${className ?? ""}`}
    />
  );
};

const BLOCKCHAIN_LINK_VARIANTS = {
  tile: {
    link: "gap-1 border border-border-faint bg-surface-muted px-2 py-1 text-muted hover:bg-surface-2",
    text: "font-normal text-[10px]",
  },
  hero: {
    link: "gap-1.5 bg-white/15 backdrop-blur-md px-3 py-1.5 text-white hover:bg-white/25",
    text: "font-medium text-[11px]",
  },
  detail: {
    link: "gap-1.5 border border-border-faint bg-surface-muted px-3 py-1.5 text-muted hover:bg-surface-2",
    text: "font-medium text-[11px]",
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
      className={`inline-flex items-center self-start rounded-full transition-colors ${classes.link}`}
    >
      <BlockchainIcon />
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
      <span className="font-medium text-[11px] leading-4 tracking-[1.6px] uppercase truncate">
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
      className="w-[253px] h-[343px] rounded-xl border border-border-strong bg-surface pt-2 pe-2 pb-4 ps-2 flex flex-col gap-2.5 cursor-pointer transition-colors hover:border-content/40"
    >
      <div className="relative h-[229px] w-full">
        <NftImage
          src={nft.imageUrl}
          alt={nft.name}
          className="h-full w-full rounded-t-2xl overflow-hidden"
        />
        <div className="absolute top-2 end-2">
          <OgyBadge />
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-between px-1">
        <div className="flex flex-col gap-0.5">
          <IssuerLine issuer={nft.issuer} className="text-muted" />
          <h3 className="font-semibold text-[15px] leading-snug text-content truncate">
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
      className="relative w-[min(85vw,520px)] sm:w-[640px] h-[360px] rounded-2xl overflow-hidden border border-border-strong bg-surface group cursor-pointer"
    >
      <NftImage
        src={nft.imageUrl}
        alt={nft.name}
        fit="contain"
        className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      <div className="absolute top-3 end-3">
        <OgyBadge size={36} />
      </div>
      <div className="absolute bottom-0 start-0 end-0 p-5 flex flex-col gap-2">
        <IssuerLine issuer={nft.issuer} className="text-white/80" />
        <h3 className="font-extrabold text-[26px] sm:text-[30px] leading-tight tracking-[-0.02em] text-white line-clamp-2">
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
        ? "w-[min(85vw,520px)] sm:w-[640px] h-[360px] rounded-2xl bg-surface-2 animate-pulse"
        : "w-[253px] h-[343px] rounded-xl bg-surface-2 animate-pulse"
    }
  />
);
