import { createContext, useContext } from "react"

import { cn } from "@/lib/utils"

const TableVariantContext = createContext("default")
const useIsHud = () => useContext(TableVariantContext) === "hud"

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
          "panel-grad",
          containerClassName
        )}>
        <table
          data-slot="table"
          className={cn(
            "w-full caption-bottom text-sm",
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
          ? [
            !isHead && "hud-spot-row",
            "data-[state=selected]:bg-brand-cyan/10",
          ]
          : [
            "border-b border-border",
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
        hud
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
