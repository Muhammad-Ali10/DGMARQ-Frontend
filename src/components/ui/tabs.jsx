import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-4", className)}
      {...props} />
  );
}

function TabsList({
  className,
  ...props
}) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn("tab-bar inline-flex w-fit items-stretch", className)}
      {...props} />
  );
}

function TabsTrigger({
  className,
  ...props
}) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "tab-item relative z-1 inline-flex flex-1 items-center justify-center gap-2 rounded-md px-3",
        "h-11 text-xs font-semibold tracking-[0.07em] whitespace-nowrap uppercase",
        "text-fg-muted transition-[color,background-color,box-shadow] duration-200 ease-out",
        "hover:text-fg data-[state=active]:text-fg",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        "disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "[&_svg]:text-accent-on-dark/70 [&_svg]:transition-[color,filter] [&_svg]:duration-200",
        "hover:[&_svg]:text-accent-on-dark data-[state=active]:[&_svg]:text-accent-on-dark",
        "data-[state=active]:[&_svg]:[filter:drop-shadow(0_0_6px_var(--accent))]",
        className
      )}
      {...props} />
  );
}

function TabsContent({
  className,
  ...props
}) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props} />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
