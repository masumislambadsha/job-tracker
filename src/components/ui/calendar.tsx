"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { VariantProps } from "class-variance-authority";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: VariantProps<typeof buttonVariants>["variant"];
}) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        months: "relative flex flex-col gap-4 sm:flex-row",
        month: "w-full",
        month_caption: "flex h-9 items-center justify-center relative",
        caption_label: "font-medium text-sm",
        nav: "absolute inset-x-0 top-0 flex w-full items-center justify-between px-1",
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-8 p-0 absolute left-1 top-1 z-10 select-none"
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-8 p-0 absolute right-1 top-1 z-10 select-none"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "text-muted-foreground size-8 text-[0.8rem] font-normal",
        week: "flex w-full mt-2",
        day: "p-0 size-8 text-sm relative",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 p-0 font-normal aria-selected:opacity-100"
        ),
        range_start: "rounded-l-md bg-primary text-primary-foreground",
        range_end: "rounded-r-md bg-primary text-primary-foreground",
        range_middle: "rounded-none bg-accent",
        today: "bg-accent text-accent-foreground rounded-md",
        outside: "text-muted-foreground opacity-50",
        selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground rounded-md",
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => (
          <div ref={rootRef} className={cn(className)} {...props} />
        ),
        Chevron: ({ orientation, className, ...props }) => {
          if (orientation === "left")
            return <ChevronLeft className={cn("size-4", className)} {...props} />;
          if (orientation === "right")
            return <ChevronRight className={cn("size-4", className)} {...props} />;
          return <ChevronDown className={cn("size-4", className)} {...props} />;
        },
        Nav: ({ className, children, ...props }) => (
          <div
            className={cn(
              "absolute inset-x-0 top-0 flex w-full items-center justify-between px-1",
              className
            )}
            {...props}
          >
            {children}
          </div>
        ),
        MonthCaption: ({ className, children, ...props }) => (
          <div
            className={cn("flex h-9 items-center justify-center relative", className)}
            {...props}
          >
            {children}
          </div>
        ),
        Weekdays: ({ className, children, ...props }) => (
          <div className={cn("flex", className)} {...props}>
            {children}
          </div>
        ),
        Weekday: ({ className, children, ...props }) => (
          <div
            className={cn(
              "text-muted-foreground size-8 text-[0.8rem] font-normal",
              className
            )}
            {...props}
          >
            {children}
          </div>
        ),
        Weeks: ({ className, children, ...props }) => (
          <div
            className={cn("flex w-full mt-2 flex-col gap-2", className)}
            {...props}
          >
            {children}
          </div>
        ),
        Week: ({ className, children, ...props }) => (
          <div className={cn("flex w-full", className)} {...props}>
            {children}
          </div>
        ),
        Day: ({ className, children, ...props }) => (
          <div className={cn("p-0 size-8 text-sm relative", className)} {...props}>
            {children}
          </div>
        ),
        DayButton: ({ className, children, ...props }) => (
          <button
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "size-8 p-0 font-normal aria-selected:opacity-100 rounded-md",
              className
            )}
            {...props}
          >
            {children}
          </button>
        ),
        ...components,
      }}
      {...props}
    />
  );
}

export { Calendar };
