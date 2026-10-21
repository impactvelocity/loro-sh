import { Link } from "react-router";

import type { AgentRefKind } from "@core/agent";
import { buttonVariants } from "@/admin-components/ui/button";
import { useReadOnly } from "@/hooks/use-read-only";

/** Opens a new agent thread with this segment, person or experience attached. Hidden view only, as the agent needs the password. */
export function AskAgentLink({ kind, id }: { kind: AgentRefKind; id: string }) {
  if (useReadOnly()) return null;
  return (
    <Link
      to={`/admin/agent?attach=${kind}:${encodeURIComponent(id)}`}
      className={buttonVariants({ variant: "secondary", size: "sm" })}
    >
      Ask Agent
    </Link>
  );
}
