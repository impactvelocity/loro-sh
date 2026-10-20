/** A bordered row of headline numbers: two across on phones, four on desktop. */
export function StatTiles({ tiles }: { tiles: { label: string; value: string }[] }) {
  return (
    <dl className="grid grid-cols-2 overflow-hidden rounded-xl bg-secondary/60 ring-1 ring-border lg:grid-cols-4">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className="flex flex-col gap-2 border-border-strong p-5 max-lg:odd:border-r max-lg:[&:nth-child(-n+2)]:border-b lg:not-last:border-r"
        >
          <dt className="text-sm font-medium text-muted-foreground">{tile.label}</dt>
          <dd className="font-heading text-3xl font-medium tabular-nums">{tile.value}</dd>
        </div>
      ))}
    </dl>
  );
}
