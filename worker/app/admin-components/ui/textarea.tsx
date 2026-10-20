import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full px-3.5 py-3 rounded-lg border-2 border-transparent bg-secondary text-base text-foreground transition-colors outline-none placeholder:text-muted-foreground hover:border-secondary-hover focus-visible:border-ring focus-visible:bg-background disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-transparent disabled:text-disabled-foreground disabled:placeholder:text-disabled-foreground aria-invalid:border-destructive aria-invalid:bg-destructive-subtle",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
