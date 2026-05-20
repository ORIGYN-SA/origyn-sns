import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import HomePage from "./pages/HomePage";
import AILocaleGate from "./pages/AIPage/AILocaleGate";
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
            <Route path="/" element={<HomePage />} />
            <Route path="/use-case/:title" element={<UseCasesPage />} />
            <Route path="/help-center" element={<HelpCenterPage />} />
            <Route path="/integrator" element={<IntegratorPage />} />
            <Route path="/integrator/join" element={<IntegratorJoinPage />} />
            <Route path="/token" element={<TokenPage />} />
            <Route path="/ai" element={<AILocaleGate />} />
            <Route path="/ai/:locale" element={<AIPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
