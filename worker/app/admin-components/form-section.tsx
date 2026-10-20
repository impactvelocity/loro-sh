/** A titled block on an edit page, separated from the one above by a rule. */
export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-6 border-t pt-8 first:border-t-0 first:pt-0">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-xl font-medium">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

/** Pressable pill for multi-select options like age ranges. */
export function ToggleChip({
  pressed,
  onPressedChange,
  children,
}: {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => onPressedChange(!pressed)}
      className="inline-flex h-9 items-center rounded-full border border-border px-4 text-sm font-medium transition-colors outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary-hover"
    >
      {children}
    </button>
  );
}
