import { useState } from "react";
import { EyeIcon } from "lucide-react";

import { Button } from "@/admin-components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/admin-components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/admin-components/ui/tabs";
import { cn } from "@/lib/utils";

export type Device = "mobile" | "desktop";

export function DeviceTabs({ device, onChange }: { device: Device; onChange: (device: Device) => void }) {
  return (
    <Tabs value={device} onValueChange={(value) => onChange(value as Device)}>
      <TabsList>
        <TabsTrigger value="mobile" className="px-3">Mobile</TabsTrigger>
        <TabsTrigger value="desktop" className="px-3">Desktop</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

/** A phone or browser outline the preview is drawn inside. */
export function DeviceFrame({
  device,
  className,
  children,
}: {
  device: Device;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden bg-background shadow-[0_8px_40px_rgb(0_0_0/0.12)] ring-1 ring-border transition-[width] duration-300",
        device === "mobile" ? "h-full max-h-[52rem] w-[24rem] max-w-full rounded-[2rem]" : "h-full w-full rounded-xl",
        className,
      )}
    >
      {device === "desktop" && (
        <div className="flex h-9 shrink-0 items-center gap-1.5 border-b bg-secondary/60 px-4">
          {[0, 1, 2].map((dot) => (
            <span key={dot} className="size-2.5 rounded-full bg-border-strong" />
          ))}
        </div>
      )}
      <div className="@container relative min-h-0 flex-1">{children}</div>
    </div>
  );
}

/** "Preview" button that opens a wide drawer with a mobile and desktop view. */
export function PreviewSheet({
  title,
  actions,
  footer,
  onOpenChange,
  trigger,
  children,
}: {
  title: string;
  /** Replaces the default Preview button. Call `open` to show the drawer. */
  trigger?: (open: () => void) => React.ReactNode;
  /** Beside the device tabs in the header, e.g. Restart. */
  actions?: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
  /** Sits under the frame, e.g. question paging. */
  footer?: React.ReactNode;
  children: (device: Device) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [device, setDevice] = useState<Device>("mobile");

  const show = () => {
    setOpen(true);
    onOpenChange?.(true);
  };

  return (
    <>
      {trigger ? (
        trigger(show)
      ) : (
        <Button variant="secondary" size="sm" onClick={show}>
          <EyeIcon data-icon="inline-start" />
          Preview
        </Button>
      )}
      <Sheet
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          onOpenChange?.(next);
        }}
      >
        <SheetContent className="gap-0 data-[side=right]:w-[90vw] data-[side=right]:sm:max-w-none">
          <div className="flex h-16 shrink-0 items-center gap-4 border-b px-6 pr-16">
            <SheetTitle className="flex-1 truncate text-lg">{title}</SheetTitle>
            {actions}
            <DeviceTabs device={device} onChange={setDevice} />
          </div>
          <div className="flex min-h-0 flex-1 flex-col items-center gap-5 bg-secondary/60 p-4 sm:p-8">
            <DeviceFrame device={device}>{children(device)}</DeviceFrame>
            {footer}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
