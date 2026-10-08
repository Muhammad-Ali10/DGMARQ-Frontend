import { cn } from "@/lib/utils"

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
