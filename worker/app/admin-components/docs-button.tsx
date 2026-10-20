import { Link } from "react-router";
import { InfoIcon } from "lucide-react";

import { buttonVariants } from "@/admin-components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/admin-components/ui/tooltip";

/**
 * Info button that links to the docs article explaining the current page.
 * `slug` is the article in `core/docs.ts`; `tooltip` overrides the hover text.
 */
export function DocsButton({
  slug,
  tooltip = "Learn how this works",
}: {
  slug: string;
  tooltip?: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            to={`/admin/docs/${slug}`}
            aria-label="Open docs"
            className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
          />
        }
      >
        <InfoIcon className="text-muted-foreground" />
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
