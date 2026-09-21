import { Link, useNavigate, useParams } from "react-router-dom";
import { DateTime } from "luxon";
import {
  PageContainer,
  PageHeader,
  PrincipalPill,
  SkeletonOverlay,
  TransactionKindPill,
} from "@components/ui";
import CopyToClipboard from "@components/buttons/CopyToClipboard";
import { useLocalePath, useT } from "@i18n/LocaleContext";
import { shortenId } from "@helpers/strings";
import useNftTransaction from "@hooks/nft/useNftTransaction";
import useNftToken from "@hooks/nft/useNftToken";
import { NftImage } from "./NftCards";

const CertificateRow = ({
  canisterId,
  tokenId,
  collectionName,
}: {
  canisterId: string;
  tokenId: string;
  collectionName?: string | null;
}) => {
  const t = useT();
  const lp = useLocalePath();
  const { card } = useNftToken(canisterId, tokenId);
  const certificatePath = lp(
    `/viewer/certificate/${canisterId}/${encodeURIComponent(tokenId)}`
  );
  const name = card?.name ?? `#${tokenId}`;

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border-strong bg-surface-1 p-3 min-w-0">
      <NftImage
        src={card?.imageUrl ?? null}
        alt={name}
        className="h-16 w-16 shrink-0 rounded-xl overflow-hidden"
      />
      <div className="flex flex-col gap-1 min-w-0">
        <span className="text-explorer-label font-medium tracking-explorer-meta uppercase text-muted">
          {t("explorer.detail.certificate")}
        </span>
        <Link
          to={certificatePath}
          className="text-explorer-card-title font-semibold leading-tight text-content truncate hover:underline"
        >
          {name}
        </Link>
        <Link
          to={lp(`/viewer/collections/${canisterId}`)}
          className="text-explorer-link-detail leading-tight text-muted truncate hover:text-content transition-colors"
        >
          {card?.collectionName ?? collectionName ?? shortenId(canisterId)}
        </Link>
      </div>
    </div>
  );
};

export const NftTransactionPage = () => {
  const t = useT();
  const lp = useLocalePath();
  const navigate = useNavigate();
  const {
    canisterId = "",
    tokenId = "",
    blockId: blockIdParam = "",
  } = useParams();

  const parsedBlockId = Number(blockIdParam);
  const blockId = Number.isInteger(parsedBlockId) ? parsedBlockId : null;

  const { transaction, isLoading, isError } = useNftTransaction({
    collection: canisterId || null,
    tokenId: tokenId || null,
    blockId,
  });

  const handleNavigateToCollector = (account: string) =>
    navigate(lp(`/viewer/collectors/${account}`));

  const notFound =
    blockId === null || (!isLoading && (isError || !transaction));

  const txTime = transaction?.tx_time
    ? DateTime.fromMillis(transaction.tx_time)
    : null;

  return (
    <PageContainer>
      <PageHeader
        category={t("explorer.title")}
        title={t("explorer.transactionPage.title")}
        onBack={() => navigate(-1)}
        right={
          <div className="inline-flex items-center gap-2 rounded-full border border-border-strong py-2 px-4 max-w-full">
            <span className="text-[14px] font-normal leading-none text-content shrink-0">
              {t("explorer.detail.tokenId")}:
            </span>
            <span
              dir="ltr"
              className="text-[14px] font-semibold leading-tight text-content truncate min-w-0"
            >
              {tokenId}
            </span>
            <CopyToClipboard value={tokenId} />
          </div>
        }
      />

      <div className="pt-8">
        {notFound ? (
          <p className="text-muted text-center">
            {t("explorer.transactionPage.notFound")}
          </p>
        ) : (
          <SkeletonOverlay loading={isLoading}>
            <div className="mx-auto max-w-[708px]">
              <div className="border border-border-strong rounded-t-[20px] py-8 px-5 flex flex-col gap-8 bg-surface">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[16px] font-medium leading-none text-muted">
                      {t("common.index")}:
                    </span>
                    <span
                      dir="ltr"
                      className="text-[22px] font-extrabold leading-none text-content truncate"
                    >
                      {blockIdParam}
                    </span>
                  </div>
                  <TransactionKindPill kind={transaction?.event_type} />
                </div>

                <CertificateRow
                  canisterId={canisterId}
                  tokenId={tokenId}
                  collectionName={transaction?.collection_name}
                />

                <div className="flex flex-col gap-4">
                  <PrincipalPill
                    label={t("common.from")}
                    value={transaction?.from_account}
                    emptyLabel={
                      transaction && !transaction.from_account
                        ? t("explorer.transactionPage.minted")
                        : undefined
                    }
                    onNavigate={handleNavigateToCollector}
                  />
                  <PrincipalPill
                    label={t("common.to")}
                    value={transaction?.to_account}
                    emptyLabel={
                      transaction && !transaction.to_account
                        ? t("explorer.transactionPage.burned")
                        : undefined
                    }
                    onNavigate={handleNavigateToCollector}
                  />
                </div>

                <div className="border-t border-border-strong pt-5 flex items-center justify-between gap-4">
                  <span className="text-[12px] font-medium leading-none text-muted">
                    {t("explorer.detail.canisterId")}
                  </span>
                  <div dir="ltr" className="flex items-center gap-2 min-w-0">
                    <span className="text-[12px] font-medium leading-tight text-muted truncate">
                      {canisterId}
                    </span>
                    <CopyToClipboard value={canisterId} />
                  </div>
                </div>
              </div>

              <div className="border-e border-b border-s border-border-strong rounded-b-[16px] p-4 flex items-center justify-center gap-2 bg-surface-muted">
                <span
                  dir="ltr"
                  className="text-[13px] font-medium leading-none text-muted"
                >
                  {txTime ? txTime.toFormat("dd/LL/yyyy HH:mm") : "—"}
                </span>
              </div>
            </div>
          </SkeletonOverlay>
        )}
      </div>
    </PageContainer>
  );
};

export default NftTransactionPage;
