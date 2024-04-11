import React from "react";
import ReactDOM from "react-dom/client";
import { createClient, Client } from "@connect2ic/core";
import { defaultProviders } from "@connect2ic/core/providers";
import { Connect2ICProvider } from "@connect2ic/react";
import "@connect2ic/core/style.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";

const queryClient = new QueryClient();

const connect2ICClient: Client = createClient({
  canisters: {},
  providers: defaultProviders,
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Connect2ICProvider client={connect2ICClient}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </Connect2ICProvider>
  </React.StrictMode>
);
