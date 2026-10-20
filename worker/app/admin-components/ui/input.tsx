import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 px-3.5 rounded-lg border-2 border-transparent bg-secondary text-base text-foreground transition-colors outline-none placeholder:text-muted-foreground hover:border-secondary-hover focus-visible:border-ring focus-visible:bg-background disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-transparent disabled:text-disabled-foreground disabled:placeholder:text-disabled-foreground aria-invalid:border-destructive aria-invalid:bg-destructive-subtle file:mr-3 file:inline-flex file:h-full file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Input }
