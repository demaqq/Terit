import { useEffect } from 'react';
import type React from 'react';

type Dismissable = HTMLElement & { __teritDismiss?: () => void };

/**
 * Props for a modal's full-screen backdrop: clicking the dimmed area outside the dialog
 * (press and release both on the backdrop, so drag-selecting text inside never closes it)
 * or pressing Escape closes the modal.
 */
export function backdrop(onClose: () => void) {
  return {
    'data-backdrop': '',
    ref: (el: HTMLDivElement | null) => {
      if (el) (el as Dismissable).__teritDismiss = onClose;
    },
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
      e.currentTarget.dataset.pressed = e.target === e.currentTarget ? '1' : '';
    },
    onClick: (e: React.MouseEvent<HTMLDivElement>) => {
      const ok = e.target === e.currentTarget && e.currentTarget.dataset.pressed === '1';
      e.currentTarget.dataset.pressed = '';
      if (ok) onClose();
    },
  };
}

/** Escape closes the topmost open modal (a modal opened over the copilot closes first). */
export function installEscapeToDismiss() {
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    const modals = document.querySelectorAll<Dismissable>('[data-backdrop]:not([data-drawer])');
    const target = modals[modals.length - 1] || document.querySelector<Dismissable>('[data-drawer]:not([hidden])');
    if (target?.__teritDismiss) {
      e.preventDefault();
      target.__teritDismiss();
    }
  });
}

/** Close a dropdown or panel when the user presses outside it or presses Escape. */
export function useClickOutside(ref: React.RefObject<HTMLElement | null>, open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [ref, open, onClose]);
}
