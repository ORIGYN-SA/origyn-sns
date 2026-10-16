import { useT } from "@/i18n/LocaleContext";
import { ApiError } from "./api";
import { toast } from "./toast";

// Maps an API error code to copy for end users; the API's own `message` is
// meant for developers.
export const useErrorMessage = () => {
  const t = useT();
  return (error) => {
    if (!error) return "";
    const key = `aiDashboard.errors.${error instanceof ApiError ? error.code : "network"}`;
    const text = t(key);
    return text === key ? t("aiDashboard.errors.unknown") : text;
  };
};

export const useErrorToast = () => {
  const errorMessage = useErrorMessage();
  return (error) => toast(errorMessage(error), { tone: "error" });
};
