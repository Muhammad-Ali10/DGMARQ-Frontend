import { createContext, useContext } from "react";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"
import {
  GLASS_BLUR,
  GLASS_FILL,
  GLASS_RADIUS,
  GLASS_SHADOW,
} from "@/lib/surface"

// Card owns its own surface, border and radius — call sites must NOT pass
// `bg-*`/`border-*`. 221 sites used to override this with `bg-primary
// border-gray-700`, which rendered cards DARKER than the page and made nested
// panels invisible. Elevation now goes lighter, the way it should on dark UI.
//
// The `hud` variant replaces the old dashboard-fx.css `.dash-card`, which
// styled this component from outside using `!important`.
// Surfaces are frosted: `/90` alpha plus a blur over the dashboard backdrop.
// The alpha is NOT a taste choice — see the --glass-alpha note in index.css.
// Measured across every real backdrop (and pure white as a worst case), 0.9 is
// the lowest value that keeps muted and subtle text above 4.5:1. Below it the
// effective background drifts with whatever is behind the card and the text
// contrast goes with it.
const cardVariants = cva(
  [
    "text-card-foreground flex flex-col gap-6 rounded-lg border py-6",
    // blur-md, not blur-xl. At 0.9 alpha only 10% of the backdrop shows
    // through, so a 24px blur is paying full compositor cost for something
    // almost invisible. 12px is still enough to soften the 1px ambiance grid
    // (which would otherwise read as faint noise behind card text), and every
    // card is a backdrop-filter region that re-samples on scroll — this is the
    // most-repeated surface in the app.
    "backdrop-blur-md",
    "transition-[border-color,box-shadow,transform] duration-200 ease-out",
  ],
  {
    variants: {
      variant: {
        // panel-grad is the fill; the bg-* token stays as the background-COLOR
        // underneath it, so text never sits on the gradient alone. panel-rim
        // replaces border-border with the panel's cyan edge.
        //
        // /70 lets the backdrop read through. Measured on the real
        // DashboardBackdrop at its brightest (top, where the scrim is only /85):
        // fg-subtle holds 6.69:1, because the scrim keeps the backdrop darker
        // than the card — transparency here costs nothing.
        default: "bg-card/70 panel-grad panel-rim shadow-e1",
        // Elevation 2 — for cards that float above other cards.
        elevated: "bg-surface-2/70 panel-grad panel-rim shadow-e2",
        // Recessed panel — wells, nested detail blocks inside another card.
        // Deliberately NOT thinned: sunken is DARKER than the page, so making
        // it transparent pulls it toward the lighter backdrop and it stops
        // reading as recessed. The one place transparency inverts the meaning.
        sunken: "bg-surface-sunken/90 panel-grad panel-rim shadow-e1",
        // Glass Card, for surfaces that are a hover TARGET — KPI tiles. Same
        // shared recipe as `hud` below and as the HUD table row, minus the top
        // hairline, because that hairline is a ::before and the spotlight's beam
        // needs ::before. A tile carries no background-COLOR at all: the row it
        // has to match has none either, and adding one here would make the tile
        // read as more solid than the row beside it.
        glass: ["relative", GLASS_FILL, GLASS_BLUR, GLASS_SHADOW, GLASS_RADIUS],
        // The dashboard HUD look, now a variant instead of a stylesheet that
        // fought the primitive. The top hairline is the old `::before` rule.
        //
        // `shadow-hud` — the product page's cyan bloom — REPLACES shadow-e2
        // rather than sitting next to it: two `shadow-*` classes on one element
        // would leave the winner to tailwind-merge's ordering. The bloom already
        // carries depth, so nothing is lost.
        //
        // No `hud-corners` here on purpose. Corner brackets mark the thing under
        // the pointer, and a panel is never that thing — hovering any row inside
        // it also hovers the panel, so bracketing the panel meant pointing at
        // one row and lighting up the whole card. Brackets live on the tile, the
        // list row (`.row-link`) and the table row instead.
        // Glass Card. The surface is the shared recipe in lib/surface.js, so this
        // and the HUD table row are literally one definition — a 180deg navy fade
        // at 45%/55% alpha, an 18px frost, a ~22% cyan rim and the layered
        // premium shadow. Genuinely translucent, not the frosted-but-solid /90
        // this variant used to be.
        //
        // That alpha is BELOW the --glass-alpha 0.9 floor documented in :root,
        // and it is safe HERE ONLY because of the scrim in DashboardBackdrop:
        // under it the backdrop measures ~rgb(21,41,83), which is essentially
        // --surface-1 itself, so thinning the card barely moves the effective
        // background. Measured at the worst point (top of page, a pure-white
        // image pixel, full aurora): fg-subtle 6.17:1 at 0.45 vs 6.31:1 at 0.90.
        // The 0.9 floor was derived against ARBITRARY backdrops including white,
        // which a dashboard card never sits on. Re-measure if the scrim changes.
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
        // A 2px lift plus an accent halo. `will-change` is deliberately absent:
        // promoting every card to its own layer costs more than the transform
        // it would save, and these are large surfaces.
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

// A `hud` card's title is the product page's cyan micro-cap label, not a normal
// card heading — so CardTitle has to know which card it is inside. Context, not
// a `[&_[data-slot=card-title]]:` descendant variant on the Card: that variant
// compiles to specificity 0,2,0 and would silently outrank a plain `text-lg`
// passed to CardTitle (0,1,0), which is the same "styled from outside" failure
// the Table primitive documents. Context puts the classes in the component that
// owns the element, so `cn()` merges a call-site className last and it wins.
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
        // `.fx-pd4-head` on the product page: 11px / 800 / .13em cyan caps.
        // --info-fg rather than that file's untokenised #7BC5FF, because this is
        // 11px text and --info-fg is the cyan already measured above 4.5:1 on
        // every surface.
        hud
          ? [
            "text-[0.6875rem] font-extrabold tracking-[0.13em] uppercase text-info",
            // Panel headings on the product page carry a lit icon
            // (`.fx-pd4-head svg { filter: drop-shadow(0 0 5px …) }`). Detail
            // pages pass the icon as a child of the title, so it is picked up
            // here rather than asked for at ~30 call sites.
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
