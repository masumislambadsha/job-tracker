import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium tracking-tight border transition-colors",
  {
    variants: {
      variant: {
        default: "border-zinc-800 bg-zinc-900 text-zinc-300",
        primary: "border-zinc-700 bg-zinc-800 text-zinc-100",
        success: "border-emerald-800/40 bg-emerald-950/40 text-emerald-300",
        warning: "border-amber-800/40 bg-amber-950/40 text-amber-300",
        danger: "border-red-800/40 bg-red-950/40 text-red-300",
        purple: "border-purple-800/40 bg-purple-950/40 text-purple-300",
        cyan: "border-sky-800/40 bg-sky-950/40 text-sky-300",
        outline: "border-zinc-800 text-zinc-400 bg-transparent",
      },
      size: {
        sm: "px-1.5 py-0 text-[10px]",
        default: "px-2 py-0.5 text-[11px]",
        lg: "px-2.5 py-1 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  dotColor?: string;
}

export function Badge({ className, variant, size, dot, dotColor, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            dotColor || "bg-current opacity-80"
          )}
        />
      )}
      {children}
    </div>
  );
}
