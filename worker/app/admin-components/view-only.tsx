import { Link, useLocation } from "react-router";
import { LockIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/** The password page, coming back here once the admin is unlocked. */
export function useUnlockHref() {
  const { pathname, search } = useLocation();
  return `/login?next=${encodeURIComponent(pathname + search)}`;
}

/** For visitors who haven't unlocked the admin: what they can't do, and the way in. */
export function ViewOnlyNote({ children, className }: { children: React.ReactNode; className?: string }) {
  const href = useUnlockHref();
  return (
    <div className={cn("flex flex-col gap-2 rounded-lg bg-secondary p-4 text-sm", className)}>
      <span className="flex items-center gap-2 font-medium">
        <LockIcon aria-hidden className="size-3.5" />
        View Only
      </span>
      <p className="text-muted-foreground">{children}</p>
      <Link to={href} className="self-start font-medium underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring">
        Unlock Admin
      </Link>
    </div>
  );
}
