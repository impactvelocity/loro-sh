import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/admin-components/ui/empty";

/** Shown on Start Page and Intake for internal types, which have neither. */
export function InternalNotice({ typeName }: { typeName: string }) {
  return (
    <Empty className="rounded-xl border border-dashed">
      <EmptyHeader>
        <EmptyTitle>Nothing to Set Up Here</EmptyTitle>
        <EmptyDescription>
          {typeName} is internal: your team creates one for someone from their profile, so there's no
          start page or intake. Use Share to create one.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
