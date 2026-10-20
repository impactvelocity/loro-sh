import { useState } from "react";
import { useNavigate } from "react-router";
import { Trash2Icon } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/admin-components/ui/alert-dialog";
import { Button } from "@/admin-components/ui/button";
import { Spinner } from "@/admin-components/ui/spinner";

/**
 * Secondary delete button that asks first. Only the final confirm is red.
 * Mocked: it pauses, then calls `onConfirm`.
 */
export function ConfirmDeleteButton({
  label,
  confirmTitle,
  confirmDescription,
  onConfirm,
  iconOnly,
}: {
  label: string;
  confirmTitle: string;
  confirmDescription: React.ReactNode;
  onConfirm: () => void;
  /** A ghost trash icon instead of the labelled button, for tight headers. */
  iconOnly?: boolean;
}) {
  const [deleting, setDeleting] = useState(false);

  return (
    <AlertDialog>
      {iconOnly ? (
        <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label={label} />}>
          <Trash2Icon />
        </AlertDialogTrigger>
      ) : (
        <AlertDialogTrigger render={<Button variant="secondary" size="sm" />}>
          {label}
        </AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <Trash2Icon />
          </AlertDialogMedia>
          <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
          <AlertDialogDescription>{confirmDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            // Stays red while busy; disabled would turn it gray.
            aria-busy={deleting}
            className={deleting ? "pointer-events-none" : undefined}
            onClick={() => {
              if (deleting) return;
              setDeleting(true);
              setTimeout(onConfirm, 700);
            }}
          >
            {deleting && <Spinner data-icon="inline-start" />}
            {deleting ? "Deleting" : label}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Delete block for the foot of an edit page: a plain secondary button that
 * opens a confirmation, then returns to `redirectTo`.
 */
export function ConfirmDelete({
  title,
  description,
  redirectTo,
  ...button
}: {
  title: string;
  description: string;
  confirmTitle: string;
  confirmDescription: React.ReactNode;
  label: string;
  redirectTo: string;
}) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-5">
      <div className="flex max-w-md flex-col gap-1">
        <span className="text-sm font-medium">{title}</span>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <ConfirmDeleteButton {...button} onConfirm={() => navigate(redirectTo)} />
    </div>
  );
}

/**
 * Confirmation for removing a part of the experience: a component, step,
 * lookup or list item. Controlled, so a menu item can open it after the menu
 * closes. Removing is a local edit, so it confirms straight away.
 */
export function ConfirmRemoveDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <Trash2Icon />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
