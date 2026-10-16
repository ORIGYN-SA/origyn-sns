import { useClerk } from "@clerk/react";
import { useT } from "@/i18n/LocaleContext";
import { useErrorMessage } from "../useErrorMessage";
import { PrimaryButton, SecondaryButton, Spinner } from "./ui";

const SessionError = ({ session }) => {
  const t = useT();
  const errorMessage = useErrorMessage();
  const { openUserProfile, signOut } = useClerk();
  const { error } = session;

  // A 401 here means the gateway refused the Clerk token itself, not that an
  // API session lapsed.
  const message =
    error.status === 401
      ? t("aiDashboard.errors.login_rejected")
      : errorMessage(error);

  const fix =
    error.code === "email_unverified" ? (
      <PrimaryButton onClick={() => openUserProfile()}>
        {t("aiDashboard.session.verifyEmail")}
      </PrimaryButton>
    ) : error.code === "email_taken" ? null : (
      <PrimaryButton
        onClick={() => session.refetch()}
        disabled={session.isFetching}
      >
        {session.isFetching ? <Spinner light /> : t("aiDashboard.retry")}
      </PrimaryButton>
    );

  return (
    <div
      role="alert"
      className="mx-auto flex max-w-md flex-col items-center rounded-3xl border border-[#ececec] bg-surface p-8 text-center"
    >
      <p className="text-base text-ink">{message}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {fix}
        <SecondaryButton onClick={() => signOut()} className="min-h-11">
          {t("aiDashboard.session.signOut")}
        </SecondaryButton>
      </div>
    </div>
  );
};

export default SessionError;
