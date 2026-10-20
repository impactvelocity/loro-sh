import { useState } from "react";
import { Link } from "react-router";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  InboxIcon,
  InfoIcon,
  MoreHorizontalIcon,
  PlusIcon,
  TriangleAlertIcon,
} from "lucide-react";

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/admin-components/ui/alert";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@/admin-components/ui/avatar";
import { Badge } from "@/admin-components/ui/badge";
import { Button, buttonVariants } from "@/admin-components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/admin-components/ui/card";
import { Checkbox } from "@/admin-components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/admin-components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/admin-components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/admin-components/ui/empty";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/admin-components/ui/field";
import { Input } from "@/admin-components/ui/input";
import { Kbd, KbdGroup } from "@/admin-components/ui/kbd";
import { Label } from "@/admin-components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/admin-components/ui/popover";
import { ScrollArea } from "@/admin-components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/admin-components/ui/select";
import { Separator } from "@/admin-components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/admin-components/ui/sheet";
import { Skeleton } from "@/admin-components/ui/skeleton";
import { Spinner } from "@/admin-components/ui/spinner";
import { Switch } from "@/admin-components/ui/switch";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/admin-components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/admin-components/ui/tabs";
import { Textarea } from "@/admin-components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/admin-components/ui/tooltip";

export function meta() {
  return [{ title: "Components · Loro" }];
}

const sections = [
  "Button",
  "Badge",
  "Input",
  "Textarea",
  "Select",
  "Checkbox",
  "Switch",
  "Field",
  "Tabs",
  "Card",
  "Alert",
  "Table",
  "Avatar",
  "Empty",
  "Overlays",
  "Feedback",
  "Misc",
] as const;

const buttonVariantNames = [
  "default",
  "outline",
  "secondary",
  "ghost",
  "destructive",
  "destructive-secondary",
  "link",
] as const;
const buttonSizes = ["xs", "sm", "default", "lg"] as const;
const iconSizes = ["icon-xs", "icon-sm", "icon", "icon-lg"] as const;
const badgeVariantNames = [
  "default",
  "secondary",
  "destructive",
  "outline",
  "ghost",
  "link",
] as const;

const segments = {
  "first-time": "First-time buyers",
  relocating: "Relocating families",
  investors: "Investors",
  downsizers: "Downsizers",
};

const profiles = [
  { name: "First-time buyers", source: "Intake form", size: 412, status: "Active" },
  { name: "Relocating families", source: "CSV import", size: 128, status: "Active" },
  { name: "Investors", source: "Intake form", size: 57, status: "Draft" },
  { name: "Downsizers", source: "Manual", size: 23, status: "Paused" },
];

function slug(name: string) {
  return name.toLowerCase();
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section id={slug(title)} className="flex scroll-mt-10 flex-col gap-6 border-t pt-10">
      <h2 className="font-heading text-xl font-medium">{title}</h2>
      <div className="flex flex-col gap-8">{children}</div>
    </section>
  );
}

/** One labelled row of examples, e.g. a single state or variant. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-3 md:grid-cols-[10rem_1fr] md:items-start">
      <span className="pt-1.5 font-mono text-xs text-muted-foreground">{label}</span>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

export default function SettingsComponents() {
  const [showStatus, setShowStatus] = useState(true);
  const [showSource, setShowSource] = useState(false);
  const [sort, setSort] = useState("recent");

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10">
      <div className="flex flex-col gap-4">
        <Link
          to="/admin/settings"
          className={buttonVariants({ variant: "ghost", size: "sm", className: "self-start" })}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Settings
        </Link>
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-[2rem] font-medium">Components</h1>
          <p className="text-muted-foreground">
            Every admin component in <code className="text-sm">app/admin-components/ui</code>,
            in each state. Hover and focus states need a pointer or keyboard.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {sections.map((section) => (
            <a
              key={section}
              href={`#${slug(section)}`}
              className="text-muted-foreground hover:text-foreground"
            >
              {section}
            </a>
          ))}
        </nav>
      </div>

      <Section title="Button">
        {buttonVariantNames.map((variant) => (
          <Row key={variant} label={variant}>
            {buttonSizes.map((size) => (
              <Button key={size} variant={variant} size={size}>
                {size === "default" ? "Button" : size}
              </Button>
            ))}
            <Button variant={variant} disabled>
              Disabled
            </Button>
          </Row>
        ))}
        <Row label="icons">
          <Button>
            <PlusIcon data-icon="inline-start" />
            New Experience
          </Button>
          <Button variant="outline">
            Continue
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
          {iconSizes.map((size) => (
            <Button key={size} variant="outline" size={size} aria-label="More">
              <MoreHorizontalIcon />
            </Button>
          ))}
        </Row>
        <Row label="loading">
          <Button disabled>
            <Spinner data-icon="inline-start" />
            Saving
          </Button>
          <Button variant="outline" disabled>
            <Spinner data-icon="inline-start" />
            Loading
          </Button>
        </Row>
        <Row label="aria-invalid">
          <Button variant="outline" aria-invalid>
            Invalid
          </Button>
        </Row>
      </Section>

      <Section title="Badge">
        <Row label="variants">
          {badgeVariantNames.map((variant) => (
            <Badge key={variant} variant={variant}>
              {variant}
            </Badge>
          ))}
        </Row>
        <Row label="with icon">
          <Badge>
            <CheckIcon data-icon="inline-start" />
            Published
          </Badge>
          <Badge variant="outline">
            <Spinner data-icon="inline-start" />
            Syncing
          </Badge>
        </Row>
      </Section>

      <Section title="Input">
        <Row label="default">
          <Input className="max-w-xs" placeholder="Search profiles" />
        </Row>
        <Row label="filled">
          <Input className="max-w-xs" defaultValue="Lakeside open house" />
        </Row>
        <Row label="disabled">
          <Input className="max-w-xs" placeholder="Disabled" disabled />
        </Row>
        <Row label="aria-invalid">
          <Input className="max-w-xs" defaultValue="not-an-email" aria-invalid />
        </Row>
        <Row label="file">
          <Input className="max-w-xs" type="file" />
        </Row>
      </Section>

      <Section title="Textarea">
        <Row label="default">
          <Textarea className="max-w-md" placeholder="What should guests know?" />
        </Row>
        <Row label="disabled">
          <Textarea className="max-w-md" placeholder="Disabled" disabled />
        </Row>
        <Row label="aria-invalid">
          <Textarea className="max-w-md" defaultValue="Too short" aria-invalid />
        </Row>
      </Section>

      <Section title="Select">
        <Row label="placeholder">
          <Select items={segments}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Choose a segment" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Segments</SelectLabel>
                {Object.entries(segments).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectSeparator />
              <SelectItem value="archived" disabled>
                Archived (disabled)
              </SelectItem>
            </SelectContent>
          </Select>
        </Row>
        <Row label="selected">
          <Select items={segments} defaultValue="investors">
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(segments).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select items={segments} defaultValue="investors">
            <SelectTrigger size="sm" className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(segments).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Row>
        <Row label="disabled">
          <Select items={segments} defaultValue="investors" disabled>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent />
          </Select>
        </Row>
        <Row label="aria-invalid">
          <Select items={segments}>
            <SelectTrigger className="w-56" aria-invalid>
              <SelectValue placeholder="Required" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(segments).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Row>
      </Section>

      <Section title="Checkbox">
        <Row label="states">
          <Label>
            <Checkbox />
            Unchecked
          </Label>
          <Label>
            <Checkbox defaultChecked />
            Checked
          </Label>
          <Label>
            <Checkbox indeterminate />
            Indeterminate
          </Label>
          <Label>
            <Checkbox disabled />
            Disabled
          </Label>
          <Label>
            <Checkbox defaultChecked disabled />
            Checked, disabled
          </Label>
          <Label>
            <Checkbox aria-invalid />
            Invalid
          </Label>
        </Row>
      </Section>

      <Section title="Switch">
        <Row label="default">
          <Label>
            <Switch />
            Off
          </Label>
          <Label>
            <Switch defaultChecked />
            On
          </Label>
          <Label>
            <Switch disabled />
            Disabled
          </Label>
          <Label>
            <Switch defaultChecked disabled />
            On, disabled
          </Label>
        </Row>
        <Row label="sm">
          <Label>
            <Switch size="sm" />
            Off
          </Label>
          <Label>
            <Switch size="sm" defaultChecked />
            On
          </Label>
        </Row>
      </Section>

      <Section title="Field">
        <Row label="vertical">
          <FieldGroup className="max-w-sm">
            <Field>
              <FieldLabel htmlFor="field-name">Experience name</FieldLabel>
              <Input id="field-name" placeholder="Lakeside open house" />
              <FieldDescription>Guests see this at the top of the page.</FieldDescription>
            </Field>
            <Field data-invalid>
              <FieldLabel htmlFor="field-email">Reply-to email</FieldLabel>
              <Input id="field-email" defaultValue="dylan@" aria-invalid />
              <FieldError>Enter a full email address.</FieldError>
            </Field>
            <Field data-disabled>
              <FieldLabel htmlFor="field-slug">Slug</FieldLabel>
              <Input id="field-slug" defaultValue="lakeside" disabled />
            </Field>
          </FieldGroup>
        </Row>
        <Row label="horizontal">
          <FieldGroup className="max-w-sm">
            <Field orientation="horizontal">
              <Switch id="field-notify" defaultChecked />
              <FieldLabel htmlFor="field-notify">Email me new intake responses</FieldLabel>
            </Field>
            <Field orientation="horizontal">
              <Checkbox id="field-terms" />
              <FieldLabel htmlFor="field-terms">Show on the public page</FieldLabel>
            </Field>
          </FieldGroup>
        </Row>
        <Row label="fieldset">
          <FieldSet className="max-w-sm">
            <FieldLegend>Notifications</FieldLegend>
            <FieldDescription>Choose what reaches your inbox.</FieldDescription>
            <FieldGroup>
              <Field orientation="horizontal">
                <Checkbox id="fs-new" defaultChecked />
                <FieldLabel htmlFor="fs-new">New profiles</FieldLabel>
              </Field>
              <Field orientation="horizontal">
                <Checkbox id="fs-weekly" />
                <FieldLabel htmlFor="fs-weekly">Weekly summary</FieldLabel>
              </Field>
            </FieldGroup>
          </FieldSet>
        </Row>
      </Section>

      <Section title="Tabs">
        <Row label="default">
          <Tabs defaultValue="segments">
            <TabsList>
              <TabsTrigger value="segments">Segments</TabsTrigger>
              <TabsTrigger value="individuals">Individuals</TabsTrigger>
              <TabsTrigger value="archived" disabled>
                Archived
              </TabsTrigger>
            </TabsList>
            <TabsContent value="segments" className="pt-2 text-muted-foreground">
              Segments panel
            </TabsContent>
            <TabsContent value="individuals" className="pt-2 text-muted-foreground">
              Individuals panel
            </TabsContent>
          </Tabs>
        </Row>
        <Row label="line">
          <Tabs defaultValue="preview">
            <TabsList variant="line">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="data">Sample data</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
          </Tabs>
        </Row>
        <Row label="vertical">
          <Tabs defaultValue="general" orientation="vertical">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="brand">Brand</TabsTrigger>
              <TabsTrigger value="domains">Domains</TabsTrigger>
            </TabsList>
          </Tabs>
        </Row>
      </Section>

      <Section title="Card">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Itinerary</CardTitle>
              <CardDescription>A day-by-day plan built around one event.</CardDescription>
            </CardHeader>
            <CardContent>Default size, header and content.</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>With Action</CardTitle>
              <CardDescription>Header action and a footer.</CardDescription>
              <CardAction>
                <Button variant="ghost" size="icon-sm" aria-label="More">
                  <MoreHorizontalIcon />
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>Body copy sits here.</CardContent>
            <CardFooter className="justify-between">
              <Badge variant="outline">paper</Badge>
              <Button variant="outline" size="sm">
                Open
              </Button>
            </CardFooter>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardTitle>Small</CardTitle>
              <CardDescription>size=&quot;sm&quot; tightens spacing.</CardDescription>
            </CardHeader>
            <CardContent>Compact content.</CardContent>
          </Card>
        </div>
      </Section>

      <Section title="Alert">
        <Row label="default">
          <Alert className="max-w-lg">
            <InfoIcon />
            <AlertTitle>Your site is private</AlertTitle>
            <AlertDescription>Only people with the link can see experiences.</AlertDescription>
          </Alert>
        </Row>
        <Row label="destructive">
          <Alert variant="destructive" className="max-w-lg">
            <TriangleAlertIcon />
            <AlertTitle>Import failed</AlertTitle>
            <AlertDescription>Row 42 is missing an email address.</AlertDescription>
          </Alert>
        </Row>
        <Row label="with action">
          <Alert className="max-w-lg">
            <AlertTitle>3 profiles need review</AlertTitle>
            <AlertDescription>They came in through Intake overnight.</AlertDescription>
            <AlertAction>
              <Button size="xs" variant="outline">
                Review
              </Button>
            </AlertAction>
          </Alert>
        </Row>
      </Section>

      <Section title="Table">
        {([false, true] as const).map((interactive) => (
          <div key={String(interactive)} className="flex flex-col gap-3">
            <span className="font-mono text-xs text-muted-foreground">
              {interactive ? "interactive (hover a row)" : "static"}
            </span>
            <Table interactive={interactive}>
              <TableCaption>
                {interactive
                  ? "Rows are clickable. The hover extends into the gutter; text stays aligned."
                  : "Flush with the page, no hover. Second row is data-state=selected."}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Segment</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">People</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile, index) => (
                  <TableRow
                    key={profile.name}
                    data-state={!interactive && index === 1 ? "selected" : undefined}
                  >
                    <TableCell className="font-medium">{profile.name}</TableCell>
                    <TableCell>{profile.source}</TableCell>
                    <TableCell className="text-right tabular-nums">{profile.size}</TableCell>
                    <TableCell>
                      <Badge variant={profile.status === "Active" ? "secondary" : "outline"}>
                        {profile.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
      </Section>

      <Section title="Avatar">
        <Row label="sizes">
          <Avatar size="sm">
            <AvatarFallback>DJ</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>DJ</AvatarFallback>
          </Avatar>
          <Avatar size="lg">
            <AvatarFallback>DJ</AvatarFallback>
          </Avatar>
        </Row>
        <Row label="badge">
          <Avatar size="lg">
            <AvatarFallback>DJ</AvatarFallback>
            <AvatarBadge />
          </Avatar>
        </Row>
        <Row label="group">
          <AvatarGroup>
            <Avatar>
              <AvatarFallback>DJ</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>AM</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>RK</AvatarFallback>
            </Avatar>
            <AvatarGroupCount>+4</AvatarGroupCount>
          </AvatarGroup>
        </Row>
      </Section>

      <Section title="Empty">
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <InboxIcon />
            </EmptyMedia>
            <EmptyTitle>No Intake Responses Yet</EmptyTitle>
            <EmptyDescription>Share an intake form and responses show up here.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm">
              <PlusIcon data-icon="inline-start" />
              New Form
            </Button>
          </EmptyContent>
        </Empty>
      </Section>

      <Section title="Overlays">
        <Row label="dialog">
          <Dialog>
            <DialogTrigger render={<Button variant="outline" />}>Open Dialog</DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rename Experience</DialogTitle>
                <DialogDescription>The public link stays the same.</DialogDescription>
              </DialogHeader>
              <Input defaultValue="Lakeside open house" />
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
                <Button>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Row>
        <Row label="sheet">
          {(["right", "left", "bottom"] as const).map((side) => (
            <Sheet key={side}>
              <SheetTrigger render={<Button variant="outline" />}>Sheet {side[0].toUpperCase() + side.slice(1)}</SheetTrigger>
              <SheetContent side={side}>
                <SheetHeader>
                  <SheetTitle>Profile Details</SheetTitle>
                  <SheetDescription>Opens from the {side}.</SheetDescription>
                </SheetHeader>
                <SheetFooter>
                  <Button>Save</Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          ))}
        </Row>
        <Row label="dropdown menu">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" />}>
              Open Menu
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Experience</DropdownMenuLabel>
                <DropdownMenuItem>
                  Edit
                  <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem>Duplicate</DropdownMenuItem>
                <DropdownMenuItem disabled>Publish (disabled)</DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem>Drafts</DropdownMenuItem>
                    <DropdownMenuItem>Archive</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>Columns</DropdownMenuLabel>
                <DropdownMenuCheckboxItem checked={showStatus} onCheckedChange={setShowStatus}>
                  Status
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={showSource} onCheckedChange={setShowSource}>
                  Source
                </DropdownMenuCheckboxItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>Sort</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
                  <DropdownMenuRadioItem value="recent">Most recent</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Row>
        <Row label="popover">
          <Popover>
            <PopoverTrigger render={<Button variant="outline" />}>Open Popover</PopoverTrigger>
            <PopoverContent>
              <PopoverHeader>
                <PopoverTitle>Share Link</PopoverTitle>
                <PopoverDescription>Anyone with the link can view.</PopoverDescription>
              </PopoverHeader>
              <Input readOnly defaultValue="loro.sh/f/itinerary" />
            </PopoverContent>
          </Popover>
        </Row>
        <Row label="tooltip">
          <Tooltip>
            <TooltipTrigger render={<Button variant="outline" />}>Hover Me</TooltipTrigger>
            <TooltipContent>
              Save Changes
              <Kbd>⌘S</Kbd>
            </TooltipContent>
          </Tooltip>
        </Row>
      </Section>

      <Section title="Feedback">
        <Row label="spinner">
          <Spinner />
          <Spinner className="size-6" />
        </Row>
        <Row label="skeleton">
          <div className="flex w-full max-w-sm items-center gap-3">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </Row>
      </Section>

      <Section title="Misc">
        <Row label="kbd">
          <Kbd>⌘</Kbd>
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
          <Kbd>Esc</Kbd>
        </Row>
        <Row label="separator">
          <div className="flex w-full max-w-sm flex-col gap-3">
            <span>Above</span>
            <Separator />
            <div className="flex h-5 items-center gap-3">
              <span>Left</span>
              <Separator orientation="vertical" />
              <span>Right</span>
            </div>
          </div>
        </Row>
        <Row label="scroll area">
          <ScrollArea className="h-40 w-64 rounded-lg border">
            <div className="flex flex-col p-3">
              {Array.from({ length: 20 }, (_, i) => (
                <span key={i} className="py-1 text-sm">
                  Profile {i + 1}
                </span>
              ))}
            </div>
          </ScrollArea>
        </Row>
        <Row label="label">
          <Label htmlFor="misc-label">Label text</Label>
        </Row>
      </Section>
    </div>
  );
}
