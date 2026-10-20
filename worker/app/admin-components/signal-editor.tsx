import { useState } from "react";
import { PlusIcon, XIcon } from "lucide-react";

import { type Signal, type SignalType, signalTypes } from "@core/profiles";
import { Button } from "@/admin-components/ui/button";
import { Input } from "@/admin-components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin-components/ui/select";

type EditableSignal = Signal & { origin?: "intake" | "owner" };

function group<T extends Signal>(signals: T[]) {
  return (Object.keys(signalTypes) as SignalType[])
    .map((type) => ({ type, items: signals.filter((signal) => signal.type === type) }))
    .filter((entry) => entry.items.length > 0);
}

function Chip({
  signal,
  onRemove,
  muted,
}: {
  signal: EditableSignal;
  onRemove?: () => void;
  muted?: boolean;
}) {
  return (
    <span
      className={
        muted
          ? "inline-flex h-8 items-center rounded-full border border-border bg-background px-3 text-sm font-medium text-muted-foreground"
          : "inline-flex h-8 items-center gap-1.5 rounded-full bg-secondary pr-1 pl-3 text-sm font-medium"
      }
    >
      {signal.name}
      {signal.origin === "intake" && (
        <span className="text-xs font-normal text-muted-foreground">intake</span>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${signal.name}`}
          className="flex size-6 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-secondary-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <XIcon className="size-3.5" />
        </button>
      )}
    </span>
  );
}

/**
 * Taste signals are Qloo entities (artists, places, brands…) a profile
 * already likes. Own signals are editable; inherited ones are read-only.
 */
export function SignalEditor<S extends EditableSignal>({
  initial = [],
  value,
  onChange,
  inherited,
}: {
  initial?: S[];
  /** Controlled, for pages that save the signals. */
  value?: S[];
  onChange?: (signals: S[]) => void;
  inherited?: { from: string; signals: Signal[] };
}) {
  const [own, setOwn] = useState<S[]>(initial);
  const signals = value ?? own;
  const setSignals = (update: (current: S[]) => S[]) => {
    const next = update(signals);
    setOwn(next);
    onChange?.(next);
  };
  const [type, setType] = useState<SignalType>("artist");
  const [name, setName] = useState("");

  function add() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSignals((current) => [...current, { type, name: trimmed, origin: "owner" } as S]);
    setName("");
  }

  return (
    <div className="flex flex-col gap-6">
      {signals.length > 0 ? (
        <div className="flex flex-col gap-4">
          {group(signals).map(({ type, items }) => (
            <div key={type} className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                {signalTypes[type]}
              </span>
              <div className="flex flex-wrap gap-2">
                {items.map((signal) => (
                  <Chip
                    key={`${signal.type}-${signal.name}`}
                    signal={signal}
                    onRemove={() =>
                      setSignals((current) => current.filter((item) => item !== signal))
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No signals yet.</p>
      )}

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          add();
        }}
      >
        <Select
          items={signalTypes}
          value={type}
          onValueChange={(value) => setType(value as SignalType)}
        >
          <SelectTrigger size="sm" className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(signalTypes).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={`Add ${signalTypes[type].toLowerCase()}`}
          className="h-9 min-w-48 flex-1 rounded-md text-sm"
        />
        <Button type="submit" variant="secondary" size="sm">
          <PlusIcon data-icon="inline-start" />
          Add
        </Button>
      </form>

      {inherited && inherited.signals.length > 0 && (
        <div className="flex flex-col gap-2 rounded-lg bg-secondary/60 p-4">
          <span className="text-xs font-medium text-muted-foreground">
            From segment · {inherited.from}
          </span>
          <div className="flex flex-wrap gap-2">
            {inherited.signals.map((signal) => (
              <Chip key={`${signal.type}-${signal.name}`} signal={signal} muted />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
