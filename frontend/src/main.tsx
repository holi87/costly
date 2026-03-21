import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/globals.css";
import App from "./App";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { OfflineIndicator } from "./components/ui/OfflineIndicator";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <OfflineIndicator />
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
