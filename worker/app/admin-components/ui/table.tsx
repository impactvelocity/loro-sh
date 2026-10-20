"use client"

import * as React from "react"
import { cn } from "cn"

/*
 * Tables sit flush with the page: edge cells have no outer padding, so text
 * lines up with headings. Static tables have no hover.
 *
 * `interactive` is for clickable rows. The table bleeds 12px into the gutter
 * and gives that padding back to the edge cells, so text still lines up while
 * the hover pill extends past it. Borders move onto cells because rounded
 * cells need the separated border model.
 */
const TableContext = React.createContext({ interactive: false })

function Table({
  className,
  interactive = false,
  ...props
}: React.ComponentProps<"table"> & { interactive?: boolean }) {
  return (
    <TableContext.Provider value={{ interactive }}>
      <div
        data-slot="table-container"
        className={cn(
          "relative w-full overflow-x-auto",
          interactive && "-mx-3 w-[calc(100%+1.5rem)]"
        )}
      >
        <table
          data-slot="table"
          data-interactive={interactive || undefined}
          className={cn(
            "w-full caption-bottom text-sm",
            interactive && "border-separate border-spacing-0",
            className
          )}
          {...props}
        />
      </div>
    </TableContext.Provider>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  const { interactive } = React.useContext(TableContext)
  return (
    <tbody
      data-slot="table-body"
      className={cn(
        "[&_tr:last-child]:border-0",
        interactive && [
          "[&>tr]:cursor-pointer [&>tr:last-child>td]:border-transparent",
          "[&>tr>td:first-child]:rounded-l-lg [&>tr>td:last-child]:rounded-r-lg",
          "[&>tr:hover>td]:border-transparent [&>tr:hover>td]:bg-secondary",
          // Hide the divider above the hovered row too, so the pill stands alone.
          "[&>tr:has(+tr:hover)>td]:border-transparent",
          "[&>tr[data-state=selected]>td]:bg-secondary",
        ],
        className
      )}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn("border-b data-[state=selected]:bg-secondary", className)}
      {...props}
    />
  )
}

function edgePadding(interactive: boolean) {
  return interactive ? "first:pl-3 last:pr-3" : "first:pl-0 last:pr-0"
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  const { interactive } = React.useContext(TableContext)
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-11 px-4 text-left align-middle text-xs font-medium whitespace-nowrap text-muted-foreground [&:has([role=checkbox])]:pr-0",
        edgePadding(interactive),
        interactive && "border-b",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  const { interactive } = React.useContext(TableContext)
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "h-14 px-4 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        edgePadding(interactive),
        interactive && "border-b transition-colors",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-left text-sm text-muted-foreground", className)}
      {...props}
    />
  )
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
