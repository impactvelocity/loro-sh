import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/*
 * Modelled on Uber Base. Types: default (primary, one per view), secondary
 * (gray, most actions), ghost (tertiary, dismissive), outline (in groups),
 * destructive (final delete) and destructive-secondary (first delete step).
 * Sizes follow Base: xs 28, sm 36, default 48, lg 56.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none aria-invalid:ring-2 aria-invalid:ring-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary-hover aria-expanded:bg-primary-hover disabled:bg-secondary disabled:text-disabled-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary-hover aria-expanded:bg-secondary-hover disabled:text-disabled-foreground",
        outline:
          "border-border bg-background hover:bg-secondary aria-expanded:bg-secondary disabled:text-disabled-foreground",
        ghost:
          "hover:bg-secondary aria-expanded:bg-secondary disabled:text-disabled-foreground",
        destructive:
          "bg-destructive text-white hover:bg-destructive-hover disabled:bg-secondary disabled:text-disabled-foreground",
        "destructive-secondary":
          "bg-secondary text-destructive hover:bg-secondary-hover disabled:text-disabled-foreground",
        link: "h-auto! px-0! text-foreground underline underline-offset-4 decoration-1 hover:decoration-2 disabled:text-disabled-foreground",
      },
      size: {
        xs: "h-7 gap-1 rounded-md px-2.5 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-9 gap-1.5 px-3 text-sm has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-4",
        default:
          "h-12 gap-2 px-4 text-base has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5 [&_svg:not([class*='size-'])]:size-5",
        lg: "h-14 gap-2 px-5 text-lg has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4 [&_svg:not([class*='size-'])]:size-5",
        "icon-xs": "size-7 rounded-md [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-9 [&_svg:not([class*='size-'])]:size-4",
        icon: "size-12 [&_svg:not([class*='size-'])]:size-5",
        "icon-lg": "size-14 [&_svg:not([class*='size-'])]:size-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
