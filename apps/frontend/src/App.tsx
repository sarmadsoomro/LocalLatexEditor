import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { ErrorBoundary } from "./components/ErrorBoundary";
import { LatexMissingBanner } from "./components/LatexMissingBanner";
import { ToastProvider } from "./components/Toast";
import { ProjectDetail } from "./pages/ProjectDetail";
import { ProjectList } from "./pages/ProjectList";
import { useSettingsStore } from "./stores/settingsStore";

function SessionExpiredNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = () => setVisible(true);
    window.addEventListener("texcraft-session-expired", show);
    return () => window.removeEventListener("texcraft-session-expired", show);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="alert"
      className="fixed inset-x-0 top-0 z-[100] bg-error px-4 py-3 text-center text-sm text-white"
    >
      Server restarted — reload the page
      <button
        type="button"
        className="ml-3 underline"
        onClick={() => window.location.reload()}
      >
        Reload
      </button>
    </div>
  );
}

function App() {
  const theme = useSettingsStore((state) => state.ui.theme);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", isDark);
    }
  }, [theme]);

  return (
    <ErrorBoundary>
      <SessionExpiredNotice />
      <LatexMissingBanner />
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<ProjectList />} />
            <Route path="/project/:id" element={<ProjectDetail />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
