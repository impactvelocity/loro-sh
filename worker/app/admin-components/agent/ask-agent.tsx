import { Link } from "react-router";

import type { AgentRefKind } from "@core/agent";
import { buttonVariants } from "@/admin-components/ui/button";

/** Opens a new agent thread with this segment, person or experience attached. */
export function AskAgentLink({ kind, id }: { kind: AgentRefKind; id: string }) {
  return (
    <Link
      to={`/admin/agent?attach=${kind}:${encodeURIComponent(id)}`}
      className={buttonVariants({ variant: "secondary", size: "sm" })}
    >
      Ask Agent
    </Link>
  );
}
