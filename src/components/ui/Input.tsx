import React, { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, leftIcon, rightIcon, helperText, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-zinc-300">
            {label}
            {props.required && <span className="ml-0.5 text-red-400">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="pointer-events-none absolute left-2.5 text-zinc-500">{leftIcon}</div>
          )}
          <input
            id={inputId}
            type={type}
            ref={ref}
            className={cn(
              "w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500",
              "transition-colors focus:border-zinc-600 focus:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50",
              leftIcon && "pl-8",
              rightIcon && "pr-8",
              error && "border-red-500 focus:border-red-500",
              className
            )}
            {...props}
          />
          {rightIcon && <div className="absolute right-2.5 text-zinc-500">{rightIcon}</div>}
        </div>
        {error && <p className="text-[11px] text-red-400 font-medium">{error}</p>}
        {helperText && !error && <p className="text-[11px] text-zinc-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
