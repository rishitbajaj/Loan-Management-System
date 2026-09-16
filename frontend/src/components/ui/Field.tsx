'use client';

import { fieldLabelClass, inputControlClass } from '@/lib/ui-classes';
import { useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

interface FieldWrapperProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function FieldWrapper({ label, htmlFor, error, hint, children }: FieldWrapperProps) {
  return (
    <div className="space-y-[7px]">
      <label htmlFor={htmlFor} className={fieldLabelClass}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-[var(--text-muted)]">{hint}</p>
      ) : null}
    </div>
  );
}

function controlClass(error?: string, withToggle = false): string {
  return `${inputControlClass} ${withToggle ? 'pr-11' : ''} ${error ? 'border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)]/12' : ''}`;
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
        <path
          d="M2.25 9s2.25-4.5 6.75-4.5S15.75 9 15.75 9s-2.25 4.5-6.75 4.5S2.25 9 2.25 9Z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <circle cx="9" cy="9" r="2.25" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    );
  }

  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M3.5 3.5 14.5 14.5M7.2 7.45A2.25 2.25 0 0 0 9 11.25c1.2 0 2.2-.75 2.8-1.8M4.8 5.05C3.55 6.05 2.65 7.45 2.25 9c0 0 2.25 4.5 6.75 4.5 1.05 0 2-.25 2.85-.7M11.1 4.35A6.4 6.4 0 0 1 15.75 9S13.5 13.5 9 13.5c-.95 0-1.85-.2-2.65-.55"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
  hint?: string;
}

export function Input({ label, id, error, hint, className = '', type, ...rest }: InputProps) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';

  return (
    <FieldWrapper label={label} htmlFor={id} error={error} hint={hint}>
      <div className="relative">
        <input
          id={id}
          {...rest}
          type={isPassword && visible ? 'text' : type}
          className={`${controlClass(error, isPassword)} ${className}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((value) => !value)}
            className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center rounded-r-[var(--radius-md)] text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--primary)]/30"
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
          >
            <EyeIcon open={visible} />
          </button>
        )}
      </div>
    </FieldWrapper>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  id: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({ label, id, error, hint, options, placeholder, className = '', ...rest }: SelectProps) {
  return (
    <FieldWrapper label={label} htmlFor={id} error={error} hint={hint}>
      <select id={id} {...rest} className={`${controlClass(error)} ${className}`}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  id: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, id, error, hint, className = '', ...rest }: TextareaProps) {
  return (
    <FieldWrapper label={label} htmlFor={id} error={error} hint={hint}>
      <textarea id={id} {...rest} className={`${controlClass(error)} h-auto min-h-28 py-3 ${className}`} />
    </FieldWrapper>
  );
}
