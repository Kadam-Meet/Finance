import React from "react";

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type State = {
  hasError: boolean;
  error?: unknown;
};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="p-6">
            <div className="max-w-xl mx-auto rounded-lg border bg-card p-6">
              <h2 className="text-lg font-semibold">Something went wrong</h2>
              <p className="text-sm text-muted-foreground mt-1">
                This page crashed due to a runtime error. Please refresh. If it keeps happening,
                share the browser console error.
              </p>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

