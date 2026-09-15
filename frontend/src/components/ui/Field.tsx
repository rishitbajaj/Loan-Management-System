import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface FieldWrapperProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function FieldWrapper({ label, htmlFor, error, hint, children }: FieldWrapperProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {error ? <p className="text-xs text-red-600">{error}</p> : hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

const CONTROL =
  'block w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-500';

function controlClass(error?: string): string {
  return `${CONTROL} ${error ? 'border-red-400 focus:ring-red-500' : 'border-slate-300'}`;
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
  hint?: string;
}

export function Input({ label, id, error, hint, className = '', ...rest }: InputProps) {
  return (
    <FieldWrapper label={label} htmlFor={id} error={error} hint={hint}>
      <input id={id} {...rest} className={`${controlClass(error)} ${className}`} />
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
      <textarea id={id} {...rest} className={`${controlClass(error)} min-h-24 ${className}`} />
    </FieldWrapper>
  );
}
