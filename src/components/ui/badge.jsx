import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  [
    "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden",
    "rounded-sm border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
    "[&>svg]:size-3 [&>svg]:pointer-events-none",
    "transition-[color,background-color,border-color] duration-150 ease-out",
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  ],
  {
    variants: {
      variant: {
        default: "",
        accent: "",
        secondary: "",
        neutral: "",
        success: "",
        warning: "",
        destructive: "",
        danger: "",
        info: "",
        outline: "border-border-interactive bg-transparent text-fg",
      },
      tone: { soft: "", solid: "" },
    },
    compoundVariants: [
      { variant: "default", tone: "soft", class: "bg-accent-soft text-accent-on-dark border-accent-on-dark/35" },
      { variant: "accent", tone: "soft", class: "bg-accent-soft text-accent-on-dark border-accent-on-dark/35" },
      { variant: "success", tone: "soft", class: "bg-success-soft text-success border-success/35" },
      { variant: "warning", tone: "soft", class: "bg-warning-soft text-warning border-warning/35" },
      { variant: "destructive", tone: "soft", class: "bg-danger-soft text-danger border-danger/35" },
      { variant: "danger", tone: "soft", class: "bg-danger-soft text-danger border-danger/35" },
      { variant: "info", tone: "soft", class: "bg-info-soft text-info border-info/35" },
      { variant: "secondary", tone: "soft", class: "bg-surface-sunken text-fg-muted border-border" },
      { variant: "neutral", tone: "soft", class: "bg-surface-sunken text-fg-muted border-border" },

      { variant: "default", tone: "solid", class: "bg-accent text-accent-foreground border-transparent" },
      { variant: "accent", tone: "solid", class: "bg-accent text-accent-foreground border-transparent" },
      { variant: "success", tone: "solid", class: "bg-success-solid text-on-solid border-transparent" },
      { variant: "warning", tone: "solid", class: "bg-warning-solid text-on-solid border-transparent" },
      { variant: "destructive", tone: "solid", class: "bg-danger-solid text-on-solid border-transparent" },
      { variant: "danger", tone: "solid", class: "bg-danger-solid text-on-solid border-transparent" },
      { variant: "info", tone: "solid", class: "bg-info-solid text-on-solid border-transparent" },
      { variant: "secondary", tone: "solid", class: "bg-surface-2 text-fg border-border" },
      { variant: "neutral", tone: "solid", class: "bg-surface-2 text-fg border-border" },
    ],
    defaultVariants: { variant: "default", tone: "soft" },
  }
)

function Badge({
  className,
  variant,
  tone,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, tone }), className)}
      {...props} />
  );
}

export { Badge, badgeVariants }
