import { useMemo, useState } from "react";
import { useWallet } from "@components/auth/useWallet";
import Auth from "@components/auth/Auth";
import { Card, PageContainer, Select } from "@components/ui";
import { useT } from "@i18n/LocaleContext";
import TransferICP from "./transfer/TransferICP";

const Recovery = () => {
  const t = useT();
  const { isConnected } = useWallet();
  const [token, setToken] = useState("");
  const selectOptions = useMemo(() => [{ value: "ICP" }], []);

  const handleOnChangeSelect = (value: string) => setToken(value);

  return (
    <PageContainer className="container max-w-none pt-8 pb-16 px-4">
      <div className="flex flex-col items-center min-h-96 gap-4 mt-8">
        <div className="max-w-2xl">
          <div className="text-center mb-8">
            <div className="text-xl sm:text-6xl font-bold">
              {t("recovery.title")}
            </div>
            <p className="text-content/60 mt-4">
              {t("recovery.description")}
            </p>
          </div>
        </div>
        <div className="w-full max-w-lg">
          <Card>
            {isConnected && (
              <>
                <Select
                  options={selectOptions}
                  value={token}
                  handleOnChange={(value) =>
                    handleOnChangeSelect(value as string)
                  }
                  placeholder={t("recovery.chooseToken")}
                />
                {token === "ICP" && (
                  <div className="mt-8">
                    <TransferICP />
                  </div>
                )}
              </>
            )}
            {!isConnected && (
              <div className="flex flex-col items-center py-8">
                <div className="font-semibold text-center mb-8">
                  {t("recovery.loginRequired")}
                </div>
                <Auth />
              </div>
            )}
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};

export default Recovery;
