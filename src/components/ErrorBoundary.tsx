"use client";

import { Component, type ReactNode, type ErrorInfo } from "react";
import { useI18n } from "@/lib/i18n";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: undefined });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <DefaultFallback error={this.state.error} onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

function DefaultFallback({ error, onRetry }: { error?: Error; onRetry: () => void }) {
  const { locale } = useI18n();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <div className="glass-card rounded-2xl p-6 text-center sm:p-8">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--danger)_12%,transparent)]">
          <AlertTriangle className="h-6 w-6 text-[var(--danger)]" aria-hidden />
        </span>
        <h2 className="mb-2 text-xl font-semibold tracking-tight">
          {locale === "vi" ? "Đã xảy ra lỗi" : "Something went wrong"}
        </h2>
        <p className="mx-auto mb-5 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">
          {error?.message ||
            (locale === "vi" ? "Vui lòng thử lại" : "Please try again")}
        </p>
        <button type="button" onClick={onRetry} className="btn-hero mx-auto text-sm">
          <RefreshCw className="h-4 w-4" aria-hidden />
          {locale === "vi" ? "Thử lại" : "Try Again"}
        </button>
      </div>
    </div>
  );
}
