"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ErrorBoundary]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-lg w-full space-y-4">
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-64 whitespace-pre-wrap break-words">
          {error.message}
          {error.stack && `\n\n${error.stack}`}
        </pre>
        {error.digest && (
          <p className="text-xs text-muted-foreground">
            Digest: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="text-sm px-4 py-2 rounded-md bg-primary text-primary-foreground"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
