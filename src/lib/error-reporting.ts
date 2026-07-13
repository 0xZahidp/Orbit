type BrowserErrorOptions = {
  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: "error" | "warning" | "info";
};

type BrowserErrorEvents = {
  captureException?: (
    error: unknown,
    context?: Record<string, unknown>,
    options?: BrowserErrorOptions,
  ) => void;
};

declare global {
  interface Window {
    __orbitErrorEvents?: BrowserErrorEvents;
  }
}

export function reportBrowserError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  window.__orbitErrorEvents?.captureException?.(
    error,
    {
      source: "react_error_boundary",
      route: window.location.pathname,
      ...context,
    },
    {
      mechanism: "react_error_boundary",
      handled: false,
      severity: "error",
    },
  );
}
