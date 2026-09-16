import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react';

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm text-[var(--text-primary)]">{children}</table>
    </div>
  );
}

export function Thead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-[var(--border)] bg-[var(--background)] text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
      {children}
    </thead>
  );
}

export function Tbody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function Tr({ children }: { children: ReactNode }) {
  return (
    <tr className="border-b border-[var(--border-light)] transition duration-150 last:border-b-0 hover:bg-[var(--primary-soft)]">
      {children}
    </tr>
  );
}

type Align = 'left' | 'right';

export function Th({
  children,
  align = 'left',
  className = '',
  ...rest
}: { children: ReactNode; align?: Align } & ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th {...rest} className={`px-[18px] py-4 font-semibold ${align === 'right' ? 'text-right' : 'text-left'} ${className}`}>
      {children}
    </th>
  );
}

export function Td({
  children,
  align = 'left',
  className = '',
  ...rest
}: { children?: ReactNode; align?: Align } & TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td {...rest} className={`px-[18px] py-4 align-middle text-sm ${align === 'right' ? 'text-right tabular-nums' : ''} ${className}`}>
      {children}
    </td>
  );
}
