import { fieldLabelClass, inputControlClass } from '@/lib/ui-classes';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

interface FieldShellProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  valid?: boolean;
  children: ReactNode;
}

function FieldShell({ label, htmlFor, error, hint, valid, children }: FieldShellProps) {
  return (
    <div className="space-y-[7px]">
      <label htmlFor={htmlFor} className={fieldLabelClass}>
        {label}
      </label>
      <div className="relative">
        {children}
        {valid && !error && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[var(--success)]" aria-hidden>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3.5 8.25 6.25 11 12.5 4.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        )}
      </div>
      {error ? (
        <p className="text-xs text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className={`text-xs ${valid ? 'text-[var(--success)]' : 'text-[var(--text-muted)]'}`}>{hint}</p>
      ) : null}
    </div>
  );
}

function controlClass(error?: string, valid?: boolean): string {
  if (error) return `${inputControlClass} border-[var(--danger)] pr-4 focus:border-[var(--danger)] focus:ring-[var(--danger)]/12`;
  if (valid) return `${inputControlClass} border-[var(--success)] pr-10 focus:border-[var(--success)] focus:ring-[var(--success)]/12`;
  return inputControlClass;
}

interface BorrowerInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
  hint?: string;
  valid?: boolean;
}

export function BorrowerInput({ label, id, error, hint, valid, className = '', ...rest }: BorrowerInputProps) {
  return (
    <FieldShell label={label} htmlFor={id} error={error} hint={hint} valid={valid}>
      <input id={id} {...rest} aria-invalid={!!error} className={`${controlClass(error, valid)} ${className}`} />
    </FieldShell>
  );
}

interface BorrowerSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  id: string;
  error?: string;
  hint?: string;
  valid?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function BorrowerSelect({ label, id, error, hint, valid, options, placeholder, className = '', ...rest }: BorrowerSelectProps) {
  return (
    <FieldShell label={label} htmlFor={id} error={error} hint={hint} valid={valid}>
      <select id={id} {...rest} aria-invalid={!!error} className={`${controlClass(error, valid)} ${className}`}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">{title}</h2>
      {children}
    </section>
  );
}
