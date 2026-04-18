import { useNavigate, useParams } from "react-router-dom";
import {
  PageHeader,
  Card,
  SkeletonOverlay,
  DatePill,
  DetailRow,
  TransactionKindPill,
} from "@components/ui";
import CopyToClipboard from "@components/buttons/CopyToClipboard";
import useFetchOneTransaction from "@hooks/transactions/useFetchOneTransaction";

const FAKE_PRINCIPAL =
  "aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaa";
const FAKE_AMOUNT = "0,000,000.00";

const PrincipalValue = ({
  value,
  isMinting,
}: {
  value: string | undefined;
  isMinting: boolean;
}) =>
  isMinting ? (
    <span className="font-semibold text-content">Minting account</span>
  ) : (
    <>
      <span className="font-semibold text-content break-all min-w-0">
        {value ?? FAKE_PRINCIPAL}
      </span>
      {value && <CopyToClipboard value={value} />}
    </>
  );

export const TransactionsDetails = () => {
  const navigate = useNavigate();
  const params = useParams();

  const { data, isLoading, isError, error } = useFetchOneTransaction({
    transactionId: params.index as string,
  });

  const handleOnClickBack = () => navigate(-1);

  const isMintFrom = data.kind === "mint";
  const isBurnTo = data.kind === "burn";

  return (
    <div className="max-w-[1440px] mx-auto pt-8 pb-16 px-6">
      <PageHeader
        category="Explorer"
        title="Transaction Details"
        onBack={handleOnClickBack}
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
          <Card className="mt-8">
            <div className="flex items-start justify-between gap-4">
              <div className="text-sm font-medium text-muted">Amount</div>
              <TransactionKindPill kind={data.kind} />
            </div>

            <div className="mt-4 flex items-baseline min-w-0">
              <img
                src="/ogy_logo.svg"
                alt=""
                className="w-12 h-12 self-center mr-3 shrink-0"
              />
              {isLoading ? (
                <div className="h-12 w-full max-w-[320px] self-center rounded-md bg-muted/20" />
              ) : (
                <>
                  <span className="font-bold text-[48px] leading-none text-content truncate min-w-0">
                    {data.formatted.amount || FAKE_AMOUNT}
                  </span>
                  <span className="ml-3 text-muted font-semibold text-[22px] leading-none shrink-0">
                    OGY
                  </span>
                </>
              )}
            </div>

            <div className="mt-4 text-sm text-muted">
              <span>+ {data.formatted.fee || "0"} OGY fee</span>
              <span className="mx-2">·</span>
              <span>Block {data.index ?? "0"}</span>
            </div>
          </Card>

          <Card className="mt-4">
            <div className="divide-y divide-border">
              <DetailRow
                label="From"
                value={
                  <PrincipalValue
                    value={data.from_account}
                    isMinting={isMintFrom}
                  />
                }
              />
              <DetailRow
                label="To"
                value={
                  <PrincipalValue
                    value={data.to_account}
                    isMinting={isBurnTo}
                  />
                }
              />
            </div>
          </Card>

          <Card className="mt-4">
            <div className="divide-y divide-border">
              <DetailRow
                label="Date"
                value={
                  data.updated_at ? (
                    <DatePill iso={data.updated_at} />
                  ) : (
                    <div
                      data-skel-static
                      className="inline-block w-[180px] h-[26px] rounded-full bg-muted/20"
                    />
                  )
                }
              />
              <DetailRow
                label="Memo"
                value={
                  data.formatted.memo && data.formatted.memo !== "-" ? (
                    <>
                      <span className="font-semibold text-content break-all min-w-0">
                        {data.formatted.memo}
                      </span>
                      <CopyToClipboard value={data.formatted.memo} />
                    </>
                  ) : (
                    <span className="text-muted">None</span>
                  )
                }
              />
            </div>
          </Card>
        </SkeletonOverlay>
      )}
    </div>
  );
};
