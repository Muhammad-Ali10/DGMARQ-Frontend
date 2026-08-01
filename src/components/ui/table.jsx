import { createContext, useContext } from "react"

import { cn } from "@/lib/utils"

// The table primitive owns its own header treatment. dashboard-fx.css used to
// restyle `thead th` from outside with `!important`; that is now the built-in
// look, so the five pages importing that stylesheet no longer need it.
//
// Numeric alignment is a first-class prop rather than a per-cell className:
// `<TableHead numeric>` / `<TableCell numeric>` applies right-alignment and
// `tabular-nums` so money columns line up on the decimal. Before this, the
// whole repo had nine `tabular-nums` in total.

// `variant="hud"` reaches head/row/cell through context, NOT through descendant
// selectors in a stylesheet. Styling `thead th` from outside is exactly what
// dashboard-fx.css did with `!important`, and it is why that file was deleted:
// an outside rule wins on specificity, so a call site can no longer override
// its own cell. Context keeps every class inside the component that owns the
// element, which means `cn()` still merges call-site classNames last.
const TableVariantContext = createContext("default")
const useIsHud = () => useContext(TableVariantContext) === "hud"

// A header row is a label, not a target: it must not take the row spotlight. The
// section is context rather than a CSS `:where(thead)` reset, because a reset
// undoes work the component just did and hides the intent from whoever reads it.
const TableSectionContext = createContext("body")
const useIsHeadSection = () => useContext(TableSectionContext) === "head"

function Table({
  className,
  containerClassName,
  variant = "default",
  ...props
}) {
  const hud = variant === "hud"
  return (
    <TableVariantContext.Provider value={variant}>
      <div
        data-slot="table-container"
        data-variant={variant}
        className={cn(
          "relative w-full overflow-x-auto",
          // Same panel utility as the cards, so a table box and a stat card are
          // literally one definition. Background-IMAGE only: whatever surface the
          // table sits on still supplies the opaque colour under the rows.
          "panel-grad",
          containerClassName
        )}>
        <table
          data-slot="table"
          className={cn(
            "w-full caption-bottom text-sm",
            // HUD rows are discrete rounded boxes with 6px of air between them,
            // like ProductDetail's `.of-row`. That needs the SEPARATE border
            // model — `border-radius` is ignored under `border-collapse:
            // collapse`, which Tailwind's preflight sets. `border-spacing-y-1.5`
            // leaves x at 0, so columns still butt together and the header band
            // stays continuous.
            hud && "border-separate border-spacing-y-1.5",
            className
          )}
          {...props} />
      </div>
    </TableVariantContext.Provider>
  );
}

function TableHeader({
  className,
  ...props
}) {
  const hud = useIsHud()
  return (
    <TableSectionContext.Provider value="head">
      <thead
        data-slot="table-header"
        // No row border in HUD mode: the separate border model ignores borders on
        // a <tr>, so the rule under the header is drawn by TableHead on the cells
        // instead.
        className={cn(!hud && "[&_tr]:border-b [&_tr]:border-border", className)}
        {...props} />
    </TableSectionContext.Provider>
  );
}

function TableBody({
  className,
  ...props
}) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props} />
  );
}

function TableFooter({
  className,
  ...props
}) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn("bg-surface-sunken border-t border-border font-medium [&>tr]:last:border-b-0", className)}
      {...props} />
  );
}

function TableRow({
  className,
  ...props
}) {
  const hud = useIsHud()
  const isHead = useIsHeadSection()
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "transition-colors duration-150 ease-out",
        hud
          // No `border-b` here: the separate border model ignores <tr> borders,
          // and the row is outlined as a box by its cells instead. Hover is
          // `hud-spot-row` — the menu's active treatment — which replaced the
          // cyan wash and the 2px left edge outright; those were a second,
          // weaker marker for the same state.
          ? [
            !isHead && "hud-spot-row",
            "data-[state=selected]:bg-brand-cyan/10",
          ]
          : [
            "border-b border-border",
            // A left accent edge on hover, drawn with an inset shadow so it
            // costs no layout and cannot shift the row.
            "hover:bg-surface-2/60 hover:shadow-[inset_2px_0_0_0_var(--color-accent-on-dark)]",
            "data-[state=selected]:bg-surface-2",
          ],
        className
      )}
      {...props} />
  );
}

function TableHead({
  className,
  numeric = false,
  ...props
}) {
  const hud = useIsHud()
  return (
    <th
      data-slot="table-head"
      scope="col"
      className={cn(
        "h-10 px-3 align-middle whitespace-nowrap",
        "text-xs font-semibold tracking-wide uppercase",
        // HUD header: a cyan-tinted band with cyan micro-caps, matching the
        // `.fx-pd4-head` label on the product page. --info-fg (not the product
        // page's untokenised #7BC5FF) because this IS text and has to clear
        // 4.5:1 at 12px; the 6% tint keeps the band above the row fill without
        // moving that measurement.
        hud
          // `border-b` on the cell, not the row: see TableHeader.
          ? "bg-brand-cyan/6 text-info border-b border-brand-cyan/20"
          : "bg-surface-sunken text-fg-subtle",
        "[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        numeric ? "text-right tabular-nums" : "text-left",
        className
      )}
      {...props} />
  );
}

function TableCell({
  className,
  numeric = false,
  ...props
}) {
  const hud = useIsHud()
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-3 py-2.5 align-middle whitespace-nowrap text-fg",
        // Hovering a row lights corner brackets on its two ends: the first cell
        // draws the left pair, the last cell the right pair. The utilities react
        // to their own parent's hover, so nothing has to be wired up per row.
        //
        // The border is per-CELL because <tr> borders do not render in the
        // separate model — top and bottom on every cell, plus the closing side
        // and the radius on the two ends. Together they outline the row as one
        // rounded box, which is `.of-row` on the product page.
        hud && [
          "first:hud-corners-start last:hud-corners-end",
          "border-y border-brand-cyan/12",
          "first:border-l first:rounded-l-xl last:border-r last:rounded-r-xl",
        ],
        "[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        numeric && "text-right tabular-nums",
        className
      )}
      {...props} />
  );
}

function TableCaption({
  className,
  ...props
}) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props} />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
