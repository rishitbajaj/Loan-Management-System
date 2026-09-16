import type { ButtonHTMLAttributes } from 'react';
import { Spinner } from './Spinner';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-[var(--primary)] text-white shadow-[var(--shadow-sm)] hover:bg-[var(--primary-hover)] hover:shadow-[var(--shadow-md)] focus-visible:ring-[var(--primary)] disabled:opacity-50',
  secondary:
    'border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-[var(--background)] focus-visible:ring-[var(--border)] disabled:text-[var(--text-disabled)]',
  danger:
    'border border-[var(--danger)]/25 bg-[var(--danger-bg)] text-[var(--danger)] hover:bg-red-100 focus-visible:ring-[var(--danger)] disabled:opacity-60',
  ghost: 'text-[var(--text-secondary)] hover:bg-[var(--border-light)] focus-visible:ring-[var(--border)] disabled:text-[var(--text-disabled)]',
};

const SIZES: Record<Size, string> = {
  sm: 'h-10 min-h-[40px] px-3.5 text-xs',
  md: 'h-11 min-h-[44px] px-5 text-sm',
};

export function Button({ variant = 'primary', size = 'md', loading = false, className = '', children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}
