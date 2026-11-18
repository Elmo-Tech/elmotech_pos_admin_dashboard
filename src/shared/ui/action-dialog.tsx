"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface ActionDialogProps {
  triggerLabel: string;
  hideTrigger?: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  kind?: "create" | "edit";
  size?: "md" | "lg" | "xl";
  triggerClassName?: string;
  closeLabel?: string;
}

export function DialogCloseButton({ children }: { children: ReactNode }) {
  return <button type="button" className="secondary-button" onClick={event => event.currentTarget.closest("dialog")?.close()}>{children}</button>;
}

export function ActionDialog({ triggerLabel, hideTrigger = false, title, description, children, kind = "create", size = "lg", triggerClassName, closeLabel = "Close" }: ActionDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const dialog = dialogRef.current;
    return () => { if (dialog?.open) dialog.close(); document.body.style.removeProperty("overflow"); };
  }, []);
  function openDialog() { dialogRef.current?.showModal(); dialogRef.current?.querySelector<HTMLInputElement>('input:not([type="hidden"]), select, textarea')?.focus(); document.body.style.overflow = "hidden"; }
  function closeDialog() { dialogRef.current?.close(); document.body.style.removeProperty("overflow"); }
  const TriggerIcon = kind === "edit" ? Pencil : Plus;
  return <>
    {hideTrigger ? null : <button type="button" onClick={openDialog} aria-haspopup="dialog" className={cn(kind === "edit" ? "secondary-button" : "primary-button", triggerClassName)}><TriggerIcon aria-hidden="true" size={16} />{triggerLabel}</button>}
    <dialog ref={dialogRef} className={cn("action-dialog text-start", size === "md" && "max-w-xl", size === "lg" && "max-w-3xl", size === "xl" && "max-w-4xl")} aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} onClose={() => document.body.style.removeProperty("overflow")} onCancel={() => document.body.style.removeProperty("overflow")} onClick={event => { if (event.target === dialogRef.current) closeDialog(); }}>
      <div className="dialog-heading"><div className="min-w-0"><span className="page-kicker mb-2">ELMODEER / OPERATIONS</span><h2 id={titleId} className="text-xl font-semibold">{title}</h2>{description ? <p id={descriptionId} className="mt-2 max-w-2xl text-xs leading-6 text-[var(--text-muted)]">{description}</p> : null}</div><button type="button" onClick={closeDialog} className="icon-button" aria-label={closeLabel}><X aria-hidden="true" size={19} /></button></div>
      <div className="dialog-body">{children}</div>
    </dialog>
  </>;
}
