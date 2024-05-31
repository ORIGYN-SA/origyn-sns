import { useMemo, useState } from "react";
import { Card, Select } from "@components/ui";
import TransferICP from "./transfer/TransferICP";

const Recovery = () => {
  //   const navigate = useNavigate();
  const [token, setToken] = useState("");
  const selectOptions = useMemo(() => [{ value: "ICP" }], []);

  //   const handleOnClick = () => null;
  const handleOnChangeSelect = (value: string) => setToken(value);

  return (
    <div className="container mx-auto pt-8 pb-16 px-4">
      <div className="flex flex-col items-center min-h-96 gap-4 mt-8">
        <div className="max-w-2xl">
          <div className="text-center mb-8">
            <div className="text-xl sm:text-6xl font-bold">
              Recover your tokens
            </div>
            <p className="text-content/60 mt-4">
              The OGY dashboard only supports the OGY token. In case you
              accidentally sent other tokens here, you can recover those by
              following the steps below.
            </p>
          </div>
        </div>
        <div className="w-full max-w-lg">
          <Card>
            <Select
              options={selectOptions}
              value={token}
              handleOnChange={(value) => handleOnChangeSelect(value as string)}
              placeholder="Choose token"
            />
            {token === "ICP" && (
              <div className="mt-8">
                <TransferICP />
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Recovery;
