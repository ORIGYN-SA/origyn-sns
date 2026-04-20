import { useNavigate, useParams } from "react-router-dom";
import { DateTime } from "luxon";
import {
  PageHeader,
  PageContainer,
  SkeletonOverlay,
  TransactionKindPill,
} from "@components/ui";
import CopyToClipboard from "@components/buttons/CopyToClipboard";
import useFetchOneTransaction from "@hooks/transactions/useFetchOneTransaction";

const FAKE_PRINCIPAL =
  "aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaa";
const FAKE_AMOUNT = "0,000,000.00";

const UserAvatarIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20a7 7 0 0 1 14 0"
      stroke="#ffffff"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PrincipalPill = ({
  label,
  value,
  isMinting,
  onNavigate,
}: {
  label: string;
  value: string | undefined;
  isMinting: boolean;
  onNavigate?: (value: string) => void;
}) => (
  <div className="flex items-center gap-3 rounded-full bg-[#F9FAFE] border border-[#E9EAF1] py-1 pl-1 pr-4 min-w-0">
    <div className="flex items-center justify-center w-[39px] h-[39px] rounded-full bg-[#D0D3E0] shrink-0">
      <UserAvatarIcon />
    </div>
    <span className="text-[14px] font-normal leading-tight text-muted shrink-0">
      {label}:
    </span>
    {isMinting ? (
      <span className="text-[14px] font-semibold leading-tight text-content truncate">
        Minting account
      </span>
    ) : value && onNavigate ? (
      <>
        <button
          type="button"
          onClick={() => onNavigate(value)}
          className="text-[14px] font-semibold leading-tight text-content truncate min-w-0 hover:underline text-left cursor-pointer"
        >
          {value}
        </button>
        <span className="ml-auto shrink-0">
          <CopyToClipboard value={value} />
        </span>
      </>
    ) : (
      <span className="text-[14px] font-semibold leading-tight text-content truncate min-w-0">
        {value ?? FAKE_PRINCIPAL}
      </span>
    )}
  </div>
);

export const TransactionsDetails = () => {
  const navigate = useNavigate();
  const params = useParams();

  const { data, isLoading, isError, error } = useFetchOneTransaction({
    transactionId: params.index as string,
  });

  const handleOnClickBack = () => navigate(-1);
  const handleNavigateToAccount = (accountId: string) =>
    navigate(`/transaction-history/transactions/accounts/${accountId}`);

  const isMintFrom = data.kind === "mint";
  const isBurnTo = data.kind === "burn";

  return (
    <PageContainer>
      <PageHeader
        category="Transaction History"
        title="Transaction Details"
        onBack={handleOnClickBack}
        right={
          <div className="inline-flex items-center gap-2 rounded-full border border-border-strong py-2 px-4">
            <span className="text-[14px] font-normal leading-none text-content">
              Hash:
            </span>
            <span className="text-[14px] font-semibold leading-none text-content truncate">
              {params.index}
            </span>
            <CopyToClipboard value={params.index as string} />
          </div>
        }
      />

      {isError ? (
        <div className="flex flex-col items-center mt-16">
          <div className="text-red-500 text-2xl font-semibold">
            Fetch one transaction error!
          </div>
          <div className="mt-4 p-4 mb-8 rounded-xl max-w-md overflow-auto bg-surface-2">
            {error?.message}
          </div>
        </div>
      ) : (
        <SkeletonOverlay loading={isLoading}>
          <div className="mt-8 mx-auto max-w-[708px]">
            <div className="border border-border-strong rounded-t-[20px] py-8 px-5 flex flex-col gap-8 bg-surface">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[16px] font-medium leading-none text-muted">
                    Index:
                  </span>
                  <span className="text-[22px] font-extrabold leading-none text-content truncate">
                    {data.index ?? "—"}
                  </span>
                </div>
                <TransactionKindPill kind={data.kind} />
              </div>

              <div className="flex flex-col gap-4">
                <PrincipalPill
                  label="From"
                  value={data.from_account}
                  isMinting={isMintFrom}
                  onNavigate={handleNavigateToAccount}
                />
                <PrincipalPill
                  label="To"
                  value={data.to_account}
                  isMinting={isBurnTo}
                  onNavigate={handleNavigateToAccount}
                />
              </div>

              <div className="border-t border-[#E1E1E1] pt-5 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[16px] font-bold leading-none text-content">
                    Amount
                  </span>
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src="/ogy_logo.svg"
                      alt=""
                      className="w-4 h-4 shrink-0"
                    />
                    <span className="text-[16px] font-bold leading-none text-content text-right truncate">
                      {data.formatted.amount || FAKE_AMOUNT} OGY
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[12px] font-medium leading-none text-muted">
                    Fee
                  </span>
                  <span className="text-[12px] font-medium leading-none text-muted text-right truncate">
                    {data.formatted.fee || "0"} OGY
                  </span>
                </div>
              </div>

              <div className="border-t border-[#E1E1E1] pt-5 flex items-center justify-between gap-4">
                <span className="text-[12px] font-medium leading-none text-muted">
                  Memo
                </span>
                {data.formatted.memo && data.formatted.memo !== "-" ? (
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[12px] font-medium leading-none text-muted truncate">
                      {data.formatted.memo}
                    </span>
                    <CopyToClipboard value={data.formatted.memo} />
                  </div>
                ) : (
                  <span className="text-[12px] font-medium leading-none text-muted">
                    None
                  </span>
                )}
              </div>
            </div>

            <div className="border-r border-b border-l border-border-strong rounded-b-[16px] p-4 flex items-center justify-center gap-2 bg-[#F9FAFE]">
              <span className="text-[13px] font-medium leading-none text-muted">
                {data.updated_at
                  ? DateTime.fromISO(data.updated_at).toFormat(
                      "dd/LL/yyyy HH:mm"
                    )
                  : "—"}
              </span>
            </div>
          </div>
        </SkeletonOverlay>
      )}
    </PageContainer>
  );
};
