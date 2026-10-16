import { useState } from "react";
import { AnimatePresence, motion as Motion } from "motion/react";
import { useT } from "@/i18n/LocaleContext";
import KeyIcon from "@/pages/AIPage/components/icons/KeyIcon";
import { useFormat } from "../format";
import { collapse } from "../motion";
import { rowKey, useCreateKey, useKeys, useRevokeKey } from "../queries";
import { toast } from "../toast";
import { useErrorToast } from "../useErrorMessage";
import NewKeyDialog from "./NewKeyDialog";
import {
  DangerButton,
  LIST,
  LIST_ITEM,
  ErrorState,
  HeaderAction,
  Panel,
  SecondaryButton,
  Skeleton,
  Spinner,
} from "./ui";

// Every row state (loading, creating, listed, confirming) has the same
// height, so changing state never moves anything.
const ROW =
  "relative flex min-h-[4.5rem] items-center justify-between gap-4 py-4";

const KeyLinesSkeleton = (props) => (
  <span className="flex flex-col gap-2" {...props}>
    <Skeleton className="h-4 w-44" />
    <Skeleton className="h-3 w-28" />
  </span>
);

const KeyRowSkeleton = () => (
  <li className={LIST_ITEM}>
    <div className={ROW}>
      <KeyLinesSkeleton />
      <Skeleton className="h-9 w-20 rounded-full" />
    </div>
  </li>
);

const KeyRow = ({ apiKey, confirming, onAskRevoke, onCancel, onRevoke }) => {
  const t = useT();
  const format = useFormat();

  return (
    <Motion.li {...collapse} className={LIST_ITEM}>
      <div className={ROW}>
        {apiKey.pending ? (
          <>
            <KeyLinesSkeleton aria-label={t("aiDashboard.keys.creating")} />
            <Spinner />
          </>
        ) : (
          <>
            {/* Stays in place under the confirmation, holding the row's size. */}
            <span className={`min-w-0 ${confirming ? "invisible" : ""}`}>
              <span className="flex items-baseline gap-2">
                <code
                  dir="ltr"
                  className="truncate font-mono text-[0.8125rem] text-ink"
                >
                  {apiKey.prefix}_••••••••
                </code>
                <span className="text-xs text-muted">#{apiKey.id}</span>
              </span>
              <time
                dateTime={apiKey.created_at}
                title={format.dateTime(apiKey.created_at)}
                className="mt-1 block text-xs text-muted"
              >
                {t("aiDashboard.keys.created").replace(
                  "{date}",
                  format.relative(apiKey.created_at),
                )}
              </time>
            </span>
            <SecondaryButton
              onClick={onAskRevoke}
              className={confirming ? "invisible" : undefined}
            >
              {t("aiDashboard.keys.revoke")}
            </SecondaryButton>
          </>
        )}

        {confirming && (
          <div className="absolute inset-x-0 inset-y-1 flex items-center justify-between gap-3 rounded-2xl bg-red-50 px-3">
            <span className="text-sm leading-snug text-red-800">
              {t("aiDashboard.keys.revokeConfirm")}
            </span>
            <span className="flex shrink-0 gap-2">
              <SecondaryButton onClick={onCancel} className="bg-white">
                {t("aiDashboard.cancel")}
              </SecondaryButton>
              <DangerButton onClick={onRevoke} autoFocus>
                {t("aiDashboard.keys.revoke")}
              </DangerButton>
            </span>
          </div>
        )}
      </div>
    </Motion.li>
  );
};

const ApiKeys = () => {
  const t = useT();
  const toastError = useErrorToast();
  const keys = useKeys();
  const create = useCreateKey();
  const revoke = useRevokeKey();
  const [revealed, setRevealed] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);

  const createKey = () =>
    create.mutate(undefined, {
      onSuccess: (data) => setRevealed(data.apiKey),
      onError: toastError,
    });

  const revokeKey = (id) => {
    setConfirmingId(null);
    revoke.mutate(id, {
      onSuccess: () => toast(t("aiDashboard.keys.revoked")),
      onError: toastError,
    });
  };

  const createButton = (
    <HeaderAction
      onClick={createKey}
      disabled={create.isPending || keys.isPending}
    >
      <span aria-hidden="true" className="text-base leading-none">
        +
      </span>
      {t("aiDashboard.keys.create")}
    </HeaderAction>
  );

  return (
    <Panel
      title={t("aiDashboard.keys.title")}
      action={createButton}
      busy={keys.isPending}
    >
      {keys.isPending ? (
        <ul className={LIST}>
          <KeyRowSkeleton />
          <KeyRowSkeleton />
        </ul>
      ) : keys.isLoadingError ? (
        <ErrorState
          error={keys.error}
          onRetry={() => keys.refetch()}
          retrying={keys.isFetching}
        />
      ) : keys.data.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-hairline px-6 py-10 text-center">
          <KeyIcon aria-hidden="true" className="h-10 w-auto" />
          <p className="mt-4 text-sm font-medium text-ink">
            {t("aiDashboard.keys.emptyTitle")}
          </p>
        </div>
      ) : (
        <ul className={LIST}>
          <AnimatePresence initial={false}>
            {keys.data.map((apiKey) => (
              <KeyRow
                key={rowKey(apiKey)}
                apiKey={apiKey}
                confirming={confirmingId === apiKey.id}
                onAskRevoke={() => setConfirmingId(apiKey.id)}
                onCancel={() => setConfirmingId(null)}
                onRevoke={() => revokeKey(apiKey.id)}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}

      {revealed && (
        <NewKeyDialog apiKey={revealed} onClose={() => setRevealed(null)} />
      )}
    </Panel>
  );
};

export default ApiKeys;
