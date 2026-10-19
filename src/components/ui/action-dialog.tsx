"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionDialogProps {
  triggerLabel: string;
  title: string;
  description?: string;
  children: ReactNode;
  kind?: "create" | "edit";
  size?: "md" | "lg" | "xl";
  triggerClassName?: string;
  closeLabel?: string;
}

export function ActionDialog({
  triggerLabel,
  title,
  description,
  children,
  kind = "create",
  size = "lg",
  triggerClassName,
  closeLabel = "Close",
}: ActionDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    return () => {
      if (dialog?.open) dialog.close();
      document.body.style.removeProperty("overflow");
    };
  }, []);

  function openDialog() {
    dialogRef.current?.showModal();
    document.body.style.overflow = "hidden";
  }

  function closeDialog() {
    dialogRef.current?.close();
    document.body.style.removeProperty("overflow");
  }

  const TriggerIcon = kind === "edit" ? Pencil : Plus;

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className={cn(kind === "edit" ? "secondary-button" : "primary-button", triggerClassName)}
      >
        <TriggerIcon aria-hidden="true" size={17} />
        {triggerLabel}
      </button>
      <dialog
        ref={dialogRef}
        onClose={() => document.body.style.removeProperty("overflow")}
        onCancel={() => document.body.style.removeProperty("overflow")}
        onClick={(event) => {
          if (event.target === dialogRef.current) closeDialog();
        }}
        className={cn(
          "action-dialog w-[calc(100%-2rem)] overflow-hidden border-0 bg-transparent p-0 text-start text-[var(--text)]",
          size === "md" && "max-w-xl",
          size === "lg" && "max-w-3xl",
          size === "xl" && "max-w-5xl",
        )}
        aria-labelledby={titleId}
      >
        <div className="overflow-hidden rounded-[22px] border border-white/70 bg-white shadow-[var(--sh-xl)]">
          <div className="relative overflow-hidden border-b border-[var(--border)] bg-[linear-gradient(135deg,#f8faff_0%,#eef3ff_100%)] px-6 py-5 sm:px-7">
            <div className="absolute -end-12 -top-20 size-40 rounded-full bg-[var(--primary)]/10 blur-3xl" aria-hidden="true" />
            <div className="relative flex items-start justify-between gap-5">
              <div>
                <span className="eyebrow mb-3">Elmo POS</span>
                <h2 id={titleId} className="text-xl font-bold tracking-[-0.02em] text-[var(--text)] sm:text-2xl">{title}</h2>
                {description ? <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">{description}</p> : null}
              </div>
              <button type="button" onClick={closeDialog} className="ghost-button size-10 shrink-0 px-0" aria-label={closeLabel}>
                <X aria-hidden="true" size={19} />
              </button>
            </div>
          </div>
          <div className="max-h-[min(72vh,760px)] overflow-y-auto p-6 sm:p-7">{children}</div>
        </div>
      </dialog>
    </>
  );
}
