import { Tooltip as TooltipPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

// shadcn ships an INVERTED tooltip (`bg-foreground text-background`) — a
// near-white block, which on a dark-only app reads as a rendering bug. Ours
// uses the elevation-2 popover surface like every other floating layer.
//
// A tooltip explains, it never carries meaning on its own — touch users never
// see it, so nothing may live exclusively in here.
function TooltipProvider({
  delayDuration = 200,
  ...props
}) {
  return (<TooltipPrimitive.Provider data-slot="tooltip-provider" delayDuration={delayDuration} {...props} />);
}

function Tooltip({
  ...props
}) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

function TooltipTrigger({
  ...props
}) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
  className,
  sideOffset = 6,
  children,
  ...props
}) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "z-[110] w-fit max-w-xs origin-(--radix-tooltip-content-transform-origin)",
          "rounded-md border border-border bg-popover px-3 py-1.5",
          "text-xs text-balance text-popover-foreground shadow-e2",
          "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
          "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}>
        {children}
        <TooltipPrimitive.Arrow
          className="z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] border-r border-b border-border bg-popover fill-popover" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
