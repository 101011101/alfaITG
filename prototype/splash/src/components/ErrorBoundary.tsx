import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-background px-6 text-center text-foreground">
          <p className="text-lg text-muted-foreground">
            Something went off-script.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full border border-foreground/20 bg-foreground/5 px-6 py-2 text-sm text-foreground transition-colors hover:bg-foreground/10"
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
