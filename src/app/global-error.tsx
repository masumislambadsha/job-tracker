"use client";

import React from "react";
import { Button } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-100 antialiased flex min-h-screen items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4">
          <h2 className="text-lg font-semibold text-zinc-100">Application Error</h2>
          <p className="text-xs text-zinc-400">
            {error.message || "A critical error occurred."}
          </p>
          <Button onClick={() => reset()} variant="primary" size="sm">
            Try Again
          </Button>
        </div>
      </body>
    </html>
  );
}
