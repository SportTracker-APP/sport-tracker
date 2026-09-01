"use client";

import type { ReactNode } from "react";
import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Loader2, X } from "lucide-react";

import styles from "./confirmation-dialog.module.css";

type ConfirmationDialogTone = "default" | "danger" | "warning" | "success";

type ConfirmationDialogProps = {
  open: boolean;
  title: string;
  description: string;
  eyebrow?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmationDialogTone;
  icon?: ReactNode;
  isLoading?: boolean;
  errorMessage?: string;
  onConfirm: () => void | Promise<void>;
  onOpenChange: (open: boolean) => void;
};

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const subscribeToClientMount = () => () => undefined;

export function ConfirmationDialog({
  open,
  title,
  description,
  eyebrow = "Confirmation requise",
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  tone = "default",
  icon,
  isLoading = false,
  errorMessage,
  onConfirm,
  onOpenChange,
}: ConfirmationDialogProps) {
  const isMounted = useSyncExternalStore(
    subscribeToClientMount,
    () => true,
    () => false,
  );
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const isLoadingRef = useRef(isLoading);
  const onOpenChangeRef = useRef(onOpenChange);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) {
      return;
    }

    previouslyFocusedElementRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusFrame = window.requestAnimationFrame(() => {
      cancelButtonRef.current?.focus();
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isLoadingRef.current) {
        event.preventDefault();
        onOpenChangeRef.current(false);
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const dialog = dialogRef.current;

      if (!dialog) {
        return;
      }

      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocusedElementRef.current?.focus();
    };
  }, [open]);

  if (!isMounted || !open) {
    return null;
  }

  function requestClose() {
    if (!isLoading) {
      onOpenChange(false);
    }
  }

  return createPortal(
    <div
      className={styles.overlay}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          requestClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-busy={isLoading}
        data-tone={tone}
        tabIndex={-1}
      >
        <button
          type="button"
          className={styles.closeButton}
          onClick={requestClose}
          disabled={isLoading}
          aria-label="Fermer la confirmation"
        >
          <X aria-hidden="true" />
        </button>

        <div className={styles.icon} aria-hidden="true">
          {icon ?? <AlertTriangle />}
        </div>

        <div className={styles.content}>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h2 id={titleId}>{title}</h2>
          <p id={descriptionId}>{description}</p>
        </div>

        {errorMessage && (
          <div className={styles.errorMessage} role="alert">
            {errorMessage}
          </div>
        )}

        <div className={styles.actions}>
          <button
            ref={cancelButtonRef}
            type="button"
            className={styles.cancelButton}
            onClick={requestClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            className={styles.confirmButton}
            onClick={() => void onConfirm()}
            disabled={isLoading}
          >
            {isLoading && (
              <Loader2 className={styles.spinner} aria-hidden="true" />
            )}
            {isLoading ? "Traitement…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
