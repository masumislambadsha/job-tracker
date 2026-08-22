"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-950/40 border border-red-800/40 text-red-400 mb-4">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h2 className="text-base font-semibold text-zinc-100">Something went wrong</h2>
      <p className="text-xs text-zinc-400 mt-1 max-w-sm">
        {error.message || "An unexpected error occurred while loading this page."}
      </p>
      <div className="mt-5 flex gap-2">
        <Button
          onClick={() => reset()}
          variant="primary"
          size="sm"
          leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
        >
          Try Again
        </Button>
        <Button
          onClick={() => window.location.href = "/dashboard"}
          variant="outline"
          size="sm"
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
