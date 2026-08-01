import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

// Sizes carry a 44px minimum on coarse pointers, so every button satisfies the
// touch-target rule without each call site opting in.
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md",
    "text-sm font-medium shrink-0 outline-none",
    "transition-[color,background-color,border-color,box-shadow] duration-150 ease-out",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    // One focus treatment for every variant. The offset keeps the ring adjacent
    // to the page surface instead of sitting on the fill, which is what holds it
    // above 3:1 even on a solid accent button.
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "aria-invalid:border-danger aria-invalid:ring-danger/30",
  ],
  {
    variants: {
      variant: {
        // The brand gradient from the header's DGMARQ Plus capsule — indigo ->
        // accent -> violet at 135deg, with a top light-catch and a violet-tinted
        // drop. Defined in index.css as `.btn-brand`; white text bottoms out at
        // 5.25:1 across the ramp. The lift on hover matches the capsule's.
        default:
          "btn-brand text-primary-foreground hover:-translate-y-px active:translate-y-0 active:duration-75",
        destructive:
          "bg-danger-solid text-on-solid border border-danger/40 hover:bg-danger-solid/90 focus-visible:ring-danger",
        outline:
          "border border-border-interactive bg-transparent text-fg hover:bg-surface-2 hover:border-ring",
        secondary:
          "bg-surface-2 text-fg border border-border hover:bg-surface-2/80",
        // Was `hover:bg-accent hover:text-accent-foreground`, which under the old
        // palette flashed a saturated blue fill on every ghost button.
        ghost:
          "text-fg-muted hover:bg-surface-2 hover:text-fg",
        link:
          "text-accent-on-dark underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3 pointer-coarse:min-h-11",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 pointer-coarse:min-h-11",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4 pointer-coarse:min-h-11",
        icon: "size-9 pointer-coarse:size-11",
        "icon-sm": "size-8 pointer-coarse:size-11",
        "icon-lg": "size-10 pointer-coarse:size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/**
 * @param {boolean} [shine] - adds the header capsule's sweeping sheen. OPT-IN on
 *   purpose: the header shows one Plus capsule, but a dashboard screen can show
 *   five primary buttons at once, and five streaks on a shared loop reads as a
 *   rendering fault (plus a repeating repaint each). Use it on a single hero CTA.
 */
function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  shine = false,
  ...props
}) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(
        buttonVariants({ variant, size }),
        shine && variant === "default" && "btn-brand--shine",
        className
      )}
      {...props} />
  );
}

export { Button, buttonVariants }
