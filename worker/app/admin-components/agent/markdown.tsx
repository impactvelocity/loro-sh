import { memo } from "react";
import { Link } from "react-router";
import { Streamdown } from "streamdown";

import { cn } from "@/lib/utils";

/**
 * The agent's replies. Streamdown renders markdown that's still arriving
 * without flashing half-closed syntax. Links into the admin stay in the app.
 */
export const Markdown = memo(function Markdown({
  children,
  streaming,
  className,
}: {
  children: string;
  streaming?: boolean;
  className?: string;
}) {
  return (
    <Streamdown
      isAnimating={streaming}
      controls={false}
      linkSafety={{ enabled: false }}
      className={cn("flex flex-col gap-3 leading-relaxed [&_li]:my-0.5", className)}
      components={{
        a: ({ href = "", children }) =>
          href.startsWith("/") ? (
            <Link to={href} className="font-medium underline underline-offset-4">
              {children}
            </Link>
          ) : (
            <a href={href} target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4">
              {children}
            </a>
          ),
      }}
    >
      {children}
    </Streamdown>
  );
});
