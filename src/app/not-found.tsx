import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <span className="text-4xl font-bold font-mono text-zinc-600">404</span>
      <h2 className="text-sm font-semibold text-zinc-200 mt-2">Page Not Found</h2>
      <p className="text-xs text-zinc-500 mt-1 max-w-xs">
        The requested page does not exist or has been moved.
      </p>
      <Link href="/dashboard" className="mt-4">
        <Button variant="primary" size="sm">
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
}
