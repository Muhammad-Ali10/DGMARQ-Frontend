import { cn } from "@/lib/utils"

/**
 * Loading placeholder.
 *
 * Was `bg-accent animate-pulse`. In stock shadcn `accent` is a muted hover
 * surface, but in this token system it is the ACTION blue — so every skeleton
 * on the site was rendering as a glowing blue block. It only ever shows while
 * data is in flight, which is why it survived unnoticed.
 *
 * Now a sunken surface with a travelling sheen. A pulse on a dark UI reads as a
 * flickering block; a sheen reads as "working".
 */
function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden rounded-md bg-surface-2",
        "bg-[linear-gradient(90deg,transparent_0%,var(--color-border-interactive)_50%,transparent_100%)]",
        "bg-[length:180%_100%] bg-no-repeat animate-shimmer",
        className
      )}
      {...props} />
  );
}

export { Skeleton }
