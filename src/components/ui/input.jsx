
import { cn } from "@/lib/utils"

// Input owns its own surface and border. The border is `--border-interactive`
// (3.22–5.20 against every surface) because on a control the border IS the
// affordance and therefore has to clear 3:1 — the old #1a2d5a managed 1.17.
// That makes fields visibly brighter than before; that is the accessibility
// floor, not a style preference.
//
// `text-base` on small screens is deliberate: anything under 16px makes iOS
// Safari zoom on focus.
function Input({
  className,
  type,
  ...props
}) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full min-w-0 rounded-md border border-input bg-surface-sunken px-3 py-1",
        "text-base text-fg md:text-sm",
        "placeholder:text-fg-subtle selection:bg-primary selection:text-primary-foreground",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-fg",
        "outline-none transition-[color,border-color,box-shadow] duration-150 ease-out",
        "hover:border-ring",
        "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-danger aria-invalid:ring-2 aria-invalid:ring-danger/30",
        "pointer-coarse:min-h-11",
        className
      )}
      {...props} />
  );
}

export { Input }
