import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster, useToasterStore, toast } from "react-hot-toast";
import { I18nProvider } from "./context/I18nContext";
import { ThemeProvider } from "./context/ThemeContext";
import "./index.css";
import App from "./App.jsx";

// مكون Toaster مخصص يحد من ظهور أكثر من توست واحد في نفس الوقت لمنع التكرار
function StrictToaster(props) {
  const { toasts } = useToasterStore();

  useEffect(() => {
    toasts
      .filter((t) => t.visible)
      .filter((_, i) => i >= 1) // الحد الأقصى توست واحد نشط
      .forEach((t) => toast.dismiss(t.id));
  }, [toasts]);

  return <Toaster {...props} />;
}

// إنشاء QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
          <App />
          <StrictToaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: "var(--toast-bg, #363636)",
                color: "var(--toast-color, #fff)",
                fontSize: "10px",
                paddingTop: "6px",
                paddingBottom: "6px",
              },
              success: {
                iconTheme: {
                  primary: "#10b981",
                  secondary: "#fff",
                },
              },
              error: {
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#fff",
                },
              },
            }}
          />
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
