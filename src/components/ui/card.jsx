import { createContext, useContext } from "react";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"
import {
  GLASS_BLUR,
  GLASS_FILL,
  GLASS_RADIUS,
  GLASS_SHADOW,
} from "@/lib/surface"

const cardVariants = cva(
  [
    "text-card-foreground flex flex-col gap-6 rounded-lg border py-6",
    "backdrop-blur-md",
    "transition-[border-color,box-shadow,transform] duration-200 ease-out",
  ],
  {
    variants: {
      variant: {
        default: "bg-card/70 panel-grad panel-rim shadow-e1",
        elevated: "bg-surface-2/70 panel-grad panel-rim shadow-e2",
        sunken: "bg-surface-sunken/90 panel-grad panel-rim shadow-e1",
        glass: ["relative", GLASS_FILL, GLASS_BLUR, GLASS_SHADOW, GLASS_RADIUS],
        hud: [
          "relative overflow-hidden",
          GLASS_FILL,
          GLASS_BLUR,
          GLASS_SHADOW,
          GLASS_RADIUS,
          "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-10 before:h-px",
          "before:bg-gradient-to-r before:from-transparent before:via-info/60 before:to-transparent",
        ],
      },
      interactive: {
        true: [
          "group/card cursor-pointer hover:-translate-y-0.5 hover:border-accent-on-dark/60 hover:shadow-[var(--elevation-hover)]",
          "active:translate-y-0 active:duration-75",
        ],
        false: "",
      },
    },
    defaultVariants: { variant: "default", interactive: false },
  }
)

const CardVariantContext = createContext(undefined)

function Card({
  className,
  variant,
  interactive,
  ...props
}) {
  return (
    <CardVariantContext.Provider value={variant}>
      <div
        data-slot="card"
        data-variant={variant}
        className={cn(cardVariants({ variant, interactive }), className)}
        {...props} />
    </CardVariantContext.Provider>
  );
}

function CardHeader({
  className,
  ...props
}) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props} />
  );
}

function CardTitle({
  className,
  ...props
}) {
  const hud = useContext(CardVariantContext) === "hud"
  return (
    <div
      data-slot="card-title"
      className={cn(
        "leading-none",
        hud
          ? [
            "text-[0.6875rem] font-extrabold tracking-[0.13em] uppercase text-info",
            "[&_svg]:text-info [&_svg]:drop-shadow-[0_0_5px_var(--color-brand-cyan)]",
          ]
          : "text-base font-semibold text-fg",
        className
      )}
      {...props} />
  );
}

function CardDescription({
  className,
  ...props
}) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props} />
  );
}

function CardAction({
  className,
  ...props
}) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props} />
  );
}

function CardContent({
  className,
  ...props
}) {
  return (<div data-slot="card-content" className={cn("px-6", className)} {...props} />);
}

function CardFooter({
  className,
  ...props
}) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props} />
  );
}

export {
  Card,
  cardVariants,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
