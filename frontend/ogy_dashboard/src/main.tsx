// import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import App from "./App.tsx";
import { colors as themeColors } from "@theme/preset";
import { Provider as AuthProvider } from "@amerej/artemis-react";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <>
    <Toaster
      position="bottom-center"
      reverseOrder={false}
      toastOptions={{
        duration: 3000,
        style: {
          background: themeColors.surface[2],
          color: themeColors.content,
        },
        // success: {
        //   duration: 3000,
        // },
        error: {
          duration: 4000,
        },
      }}
    />
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </AuthProvider>
  </>
);
