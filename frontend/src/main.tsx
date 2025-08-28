import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import "./index.css";
import { Toaster } from "react-hot-toast";

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HelmetProvider>
      <Provider store={store}>
        <QueryClientProvider client={qc}>
          <BrowserRouter>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                style: { borderRadius: 12, background: "#ffffff", color: "#0f172a", border: "1px solid #e5e7eb" },
                success: { iconTheme: { primary: "#2563eb", secondary: "#fff" } },
                error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
              }}
            />
          </BrowserRouter>
        </QueryClientProvider>
      </Provider>
    </HelmetProvider>
  </React.StrictMode>
);
