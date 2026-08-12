import { Route, Routes } from "react-router-dom";
import useScrollToTopOnNavigate from "@/hooks/useScrollToTopOnNavigate";
import { usePageTitle } from "@/hooks/usePageTitle";
import LocaleGate, { LocaleRedirect } from "@/i18n/LocaleGate";
import HomePage from "@/pages/HomePage";
import {
  AIPage,
  DPPPage,
  HelpCenterPage,
  IntegratorJoinPage,
  IntegratorPage,
  TokenPage,
  UseCasesPage,
} from "./lazyPages";

const AppRoutes = () => {
  useScrollToTopOnNavigate();
  usePageTitle();

  return (
    <Routes>
      <Route path="/:locale" element={<LocaleGate />}>
        <Route index element={<HomePage />} />
        <Route path="use-case/:title" element={<UseCasesPage />} />
        <Route path="help-center" element={<HelpCenterPage />} />
        <Route path="integrator" element={<IntegratorPage />} />
        <Route path="integrator/join" element={<IntegratorJoinPage />} />
        <Route path="token" element={<TokenPage />} />
        <Route path="ai" element={<AIPage />} />
        <Route path="dpp" element={<DPPPage />} />
      </Route>
      <Route path="*" element={<LocaleRedirect />} />
    </Routes>
  );
};

export default AppRoutes;
