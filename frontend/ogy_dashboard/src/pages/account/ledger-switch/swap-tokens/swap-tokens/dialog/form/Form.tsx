import { useQueryClient } from "@tanstack/react-query";
import { Tooltip, Skeleton, Button } from "@components/ui";
import CopyToClipboard from "@components/buttons/CopyToClipboard";
import { useT } from "@i18n/LocaleContext";
import { useSwapTokens } from "../../context";

const Form = () => {
  const t = useT();
  const queryClient = useQueryClient();
  const { accountId, sendTokens, requestSwap, fetchBalanceLegacy } =
    useSwapTokens();
  const { mutate: mutateSendTokens } = sendTokens;
  const { mutate: mutateRequestSwap } = requestSwap;
  const { data: balanceOGYLegacy } = fetchBalanceLegacy;

  const handleOnClick = () => {
    mutateSendTokens(undefined, {
      onSuccess: (data) => {
        mutateRequestSwap(
          { blockIndex: data as bigint },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: ["userFetchBalanceOGYLegacy"],
              });
              queryClient.invalidateQueries({
                queryKey: ["userFetchBalanceOGY"],
              });
            },
          }
        );
      },
    });
  };

  return (
    <div className="text-center">
      <div className="font-bold text-lg">
        {t("account.ledgerSwitch.swap.form.title")}
      </div>
      <div className="text-sm text-content/60 mb-12">
        {t("account.ledgerSwitch.swap.form.description")}
      </div>
      <div className="mb-8 rounded-xl bg-surface-2 border border-border">
        <div className="truncate p-4 border-b border-border">
          <div className="flex items-center">
            <div className="me-2 shrink-0">
              {t("account.ledgerSwitch.accountId")}{" "}
            </div>
            {accountId ? (
              <>
                {/* Account ID is an inherently-LTR identifier; keep it LTR so
                    RTL bidi doesn't reorder the truncated string. */}
                <Tooltip content={accountId}>
                  <div dir="ltr" className="truncate text-start">{accountId}</div>
                </Tooltip>
                <CopyToClipboard value={accountId as string} />
              </>
            ) : (
              <Skeleton className="w-32" />
            )}
          </div>
        </div>

        <div className="px-4 py-4">
          <div className="flex justify-between items-center font-bold">
            <div className="">
              {t("account.ledgerSwitch.swap.form.tokensAvailable")}
            </div>
            <div dir="ltr">{balanceOGYLegacy?.balance} OGY</div>
          </div>
        </div>
      </div>
      <div className="text-content/60 my-8">
        {t("account.ledgerSwitch.swap.form.youWillReceivePrefix")}{" "}
        {balanceOGYLegacy?.balance}{" "}
        {t("account.ledgerSwitch.swap.form.youWillReceiveSuffix")}
      </div>
      <Button onClick={handleOnClick}>
        {t("account.ledgerSwitch.swap.form.swapPrefix")}{" "}
        {balanceOGYLegacy?.balance}{" "}
        {t("account.ledgerSwitch.swap.form.swapSuffix")}
      </Button>
    </div>
  );
};

export default Form;
