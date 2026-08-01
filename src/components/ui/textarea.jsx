
import { cn } from "@/lib/utils"

// Matched to Input: same surface, same border token, same hover/focus ladder.
// The stock version carried `dark:` variants that never applied (this app has
// no `.dark` class on the root) and had no hover state at all — nothing
// happened until the field took focus.
function Textarea({
  className,
  ...props
}) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-md border border-input bg-surface-sunken px-3 py-2",
        "text-base text-fg md:text-sm",
        "placeholder:text-fg-subtle selection:bg-primary selection:text-primary-foreground",
        "outline-none transition-[color,border-color,box-shadow] duration-150 ease-out",
        "hover:border-ring",
        "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-danger aria-invalid:ring-2 aria-invalid:ring-danger/30",
        className
      )}
      {...props} />
  );
}

export { Textarea }
