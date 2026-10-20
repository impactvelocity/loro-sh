"use client"

import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { cn } from "cn"

function Switch({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center rounded-full p-0.5 transition-colors outline-none group-has-[:focus-visible]/field-label:ring-0 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 aria-invalid:ring-2 aria-invalid:ring-destructive data-[size=default]:h-6 data-[size=default]:w-10 data-[size=sm]:h-5 data-[size=sm]:w-8 data-checked:bg-primary data-checked:hover:bg-primary-hover data-unchecked:bg-[oklch(0.86_0_0)] data-unchecked:hover:bg-[oklch(0.8_0_0)] data-disabled:cursor-not-allowed data-disabled:bg-secondary-hover",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block rounded-full bg-background shadow-[0_1px_3px_rgb(0_0_0/0.2)] transition-transform duration-200 group-data-[size=default]/switch:size-5 group-data-[size=sm]/switch:size-4 data-checked:translate-x-4 data-unchecked:translate-x-0 group-data-[size=sm]/switch:data-checked:translate-x-3"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
