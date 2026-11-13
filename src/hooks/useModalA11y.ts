import { useEffect, useRef, type RefObject } from "react";
import { getWrappedFocusIndex } from "./focusTrap";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter((el) => !el.hasAttribute("inert") && el.getClientRects().length > 0);
}

/**
 * Dialog behaviour for a modal while `open`: Esc calls `onClose`, focus moves
 * into the dialog (to `initialFocusRef` or the first focusable element), Tab is
 * trapped inside, body scrolling is locked, and focus returns to the previously
 * focused element on close. Attach the returned ref to the dialog element and
 * give it `role="dialog"`, `aria-modal="true"`, `aria-labelledby` and
 * `tabIndex={-1}`.
 */
export function useModalA11y<T extends HTMLElement = HTMLDivElement>(
  open: boolean,
  onClose: () => void,
  initialFocusRef?: RefObject<HTMLElement | null>,
): RefObject<T | null> {
  const containerRef = useRef<T | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const container = containerRef.current;
    if (!container) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const initial =
      initialFocusRef?.current ?? getFocusable(container)[0] ?? container;
    initial.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = getFocusable(container);
      if (focusable.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }
      const active = document.activeElement;
      const currentIndex = active instanceof HTMLElement ? focusable.indexOf(active) : -1;
      const nextIndex = getWrappedFocusIndex(currentIndex, focusable.length, event.shiftKey);
      if (nextIndex !== null) {
        event.preventDefault();
        focusable[nextIndex]?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [open, initialFocusRef]);

  return containerRef;
}
