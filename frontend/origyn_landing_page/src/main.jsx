import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import HomePage from "./pages/HomePage";
import LocaleGate, { LocaleRedirect } from "./i18n/LocaleGate";
import "@origyn/shared-ui/tokens.css";
import "./styles/tailwind.css";
import "./styles/main.scss";

const UseCasesPage = lazy(() => import("./pages/UseCasesPage"));
const HelpCenterPage = lazy(() => import("./pages/HelpCenterPage"));
const IntegratorPage = lazy(() => import("./pages/IntegratorPage"));
const IntegratorJoinPage = lazy(() => import("./pages/IntegratorJoinPage"));
const TokenPage = lazy(() => import("./pages/TokenPage"));
const AIPage = lazy(() => import("./pages/AIPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense>
          <Routes>
            {/* All in-app pages live under /:locale/. The gate validates the
                segment and provides the active locale to descendants. */}
            <Route path="/:locale" element={<LocaleGate />}>
              <Route index element={<HomePage />} />
              <Route path="use-case/:title" element={<UseCasesPage />} />
              <Route path="help-center" element={<HelpCenterPage />} />
              <Route path="integrator" element={<IntegratorPage />} />
              <Route path="integrator/join" element={<IntegratorJoinPage />} />
              <Route path="token" element={<TokenPage />} />
              <Route path="ai" element={<AIPage />} />
            </Route>
            {/* Anything else (including "/", "/ai", "/token", etc.) gets
                negotiated client-side and redirected to /:locale/<path>. */}
            <Route path="*" element={<LocaleRedirect />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
