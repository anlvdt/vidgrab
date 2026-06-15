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
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="glass-card rounded-xl p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-[var(--danger)] mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          {locale === "vi" ? "Đã xảy ra lỗi" : "Something went wrong"}
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          {error?.message || (locale === "vi" 
            ? "Vui lòng thử lại" 
            : "Please try again")}
        </p>
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
        >
          <RefreshCw className="w-4 h-4" />
          {locale === "vi" ? "Thử lại" : "Try Again"}
        </button>
      </div>
    </div>
  );
}
