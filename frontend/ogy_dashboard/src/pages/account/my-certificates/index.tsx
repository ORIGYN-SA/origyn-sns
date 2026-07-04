import { useState } from "react";
import { Link } from "react-router-dom";
import { Carousel } from "@components/ui";
import { useWallet } from "@components/auth/useWallet";
import { useLocalePath, useT } from "@i18n/LocaleContext";
import { useNftAccountNfts } from "@hooks/nft/useNftAccount";
import { NftCard } from "@hooks/nft/mapNft";
import { NftTile } from "@pages/explorer/NftCards";
import CertificateDialog from "@pages/explorer/CertificateDialog";

const PREVIEW_LIMIT = 12;

// Certificates held by the connected wallet. Hidden when the account owns none.
const MyCertificates = ({ className = "" }: { className?: string }) => {
  const t = useT();
  const lp = useLocalePath();
  const { principalId } = useWallet();
  const [selectedNft, setSelectedNft] = useState<NftCard | null>(null);

  const { cards, total, isLoading } = useNftAccountNfts(principalId ?? null, {
    limit: PREVIEW_LIMIT,
  });

  if (isLoading || cards.length === 0) return null;

  return (
    <section className={className}>
      <div className="flex items-baseline justify-between mb-6">
        <h2 className="text-[22px] font-semibold leading-none text-content">
          {t("account.myCertificates.title")}
        </h2>
        {total > PREVIEW_LIMIT && principalId && (
          <Link
            to={lp(`/explorer/collectors/${principalId}`)}
            className="text-sm text-muted hover:text-content transition-colors"
          >
            {t("explorer.viewAll")}
          </Link>
        )}
      </div>
      <Carousel>
        {cards.map((nft) => (
          <Carousel.Item key={nft.id}>
            <NftTile nft={nft} onSelect={setSelectedNft} />
          </Carousel.Item>
        ))}
      </Carousel>
      <CertificateDialog
        nft={selectedNft}
        onClose={() => setSelectedNft(null)}
      />
    </section>
  );
};

export default MyCertificates;
