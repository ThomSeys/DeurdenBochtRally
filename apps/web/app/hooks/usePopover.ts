import { useEffect, useRef, useState } from "react";

/**
 * Manages open/close state for a popover or dropdown.
 * - Closes when clicking outside the container element.
 * - Closes when pressing Escape.
 *
 * Returns `open`, `setOpen`, and a `ref` to attach to the container element.
 */
export const usePopover = <T extends HTMLElement = HTMLDivElement>() => {
  const [open, setOpen] = useState(false);
  const ref = useRef<T>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return { open, setOpen, ref };
};
