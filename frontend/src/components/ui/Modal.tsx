'use client';

import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  preventClose?: boolean;
  size?: 'md' | 'lg';
}

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  preventClose = false,
  size = 'md',
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !preventClose) onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose, preventClose]);

  if (!open) return null;

  return (
    <div
      className="animate-overlay fixed inset-0 z-50 flex items-end justify-center bg-[rgba(15,23,42,0.35)] p-4 sm:items-center"
      onClick={() => {
        if (!preventClose) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`animate-panel flex max-h-[min(90dvh,calc(100vh-2rem))] w-full flex-col rounded-[var(--radius-2xl)] border border-[var(--border)] bg-white p-7 shadow-[var(--shadow-modal)] ${
          size === 'lg' ? 'max-w-4xl' : 'max-w-[520px]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="shrink-0">
          <h2 id="modal-title" className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
            {title}
          </h2>
          {description && <p className="mt-2 text-sm text-[var(--text-muted)]">{description}</p>}
        </header>
        <div className="mt-5 min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
        {footer && (
          <footer className="mt-6 shrink-0 flex flex-col-reverse gap-2 border-t border-[var(--border-light)] pt-5 sm:flex-row sm:justify-end">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
