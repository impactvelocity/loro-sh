import { useRef, useState } from "react";
import { ArrowUpIcon, PlusIcon, SquareIcon, XIcon } from "lucide-react";

import { type AgentRef, type AgentRefKind, MESSAGE_MAX, refKindLabels } from "@core/agent";
import { Badge } from "@/admin-components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/admin-components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/admin-components/ui/input-group";

export type Attachable = Record<AgentRefKind, { id: string; label: string }[]>;

const kinds: { kind: AgentRefKind; plural: string }[] = [
  { kind: "segment", plural: "Segments" },
  { kind: "person", plural: "People" },
  { kind: "experience", plural: "Experiences" },
];

/**
 * The message field. "+" attaches a segment, person or experience, so the
 * agent reads it before answering. Enter sends; Shift+Enter is a new line.
 */
export function Composer({
  attachable,
  refs,
  onRefsChange,
  busy,
  onSend,
  onStop,
  inputRef,
}: {
  attachable: Attachable;
  refs: AgentRef[];
  onRefsChange: (refs: AgentRef[]) => void;
  busy: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
  inputRef?: React.Ref<HTMLTextAreaElement>;
}) {
  const [text, setText] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const canSend = text.trim().length > 0 && !busy;

  const attached = (ref: { id: string }, kind: AgentRefKind) => refs.some((r) => r.kind === kind && r.id === ref.id);

  return (
    <form
      ref={form}
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSend) return;
        onSend(text.trim());
        setText("");
      }}
    >
      <InputGroup className="rounded-2xl border-2 border-transparent bg-secondary transition-colors has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:bg-background has-[[data-slot=input-group-control]:focus-visible]:ring-0">
        {refs.length > 0 && (
          <InputGroupAddon align="block-start" className="flex-wrap gap-1.5 px-3 pt-3">
            {refs.map((ref) => (
              <Badge key={`${ref.kind}:${ref.id}`} variant="outline" className="h-7 gap-1.5 bg-background pr-1">
                <span className="text-muted-foreground">{refKindLabels[ref.kind]}</span>
                <span className="max-w-48 truncate">{ref.label}</span>
                <button
                  type="button"
                  aria-label={`Remove ${ref.label}`}
                  className="flex size-5 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
                  onClick={() => onRefsChange(refs.filter((r) => r !== ref))}
                >
                  <XIcon className="size-3" />
                </button>
              </Badge>
            ))}
          </InputGroupAddon>
        )}
        <InputGroupTextarea
          ref={inputRef}
          value={text}
          maxLength={MESSAGE_MAX}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              form.current?.requestSubmit();
            }
          }}
          rows={1}
          placeholder="Ask about your profiles, segments or experiences"
          aria-label="Message"
          className="field-sizing-content max-h-48 min-h-11 px-4 pt-3 text-base md:text-sm"
        />
        <InputGroupAddon align="block-end" className="px-2 pb-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <InputGroupButton size="icon-sm" variant="ghost" className="rounded-full" aria-label="Attach from the workspace" />
              }
            >
              <PlusIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Attach</DropdownMenuLabel>
                {kinds.map(({ kind, plural }) => (
                  <DropdownMenuSub key={kind}>
                    <DropdownMenuSubTrigger disabled={attachable[kind].length === 0}>{plural}</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="max-h-80 w-64 overflow-y-auto">
                      {attachable[kind].map((item) => (
                        <DropdownMenuItem
                          key={item.id}
                          disabled={attached(item, kind)}
                          onClick={() => onRefsChange([...refs, { kind, id: item.id, label: item.label }])}
                        >
                          <span className="truncate">{item.label}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          {busy ? (
            <InputGroupButton
              type="button"
              size="icon-sm"
              variant="default"
              className="ml-auto rounded-full"
              aria-label="Stop"
              onClick={onStop}
            >
              <SquareIcon className="size-3 fill-current" />
            </InputGroupButton>
          ) : (
            <InputGroupButton
              type="submit"
              size="icon-sm"
              variant="default"
              className="ml-auto rounded-full"
              aria-label="Send"
              disabled={!canSend}
            >
              <ArrowUpIcon />
            </InputGroupButton>
          )}
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}
