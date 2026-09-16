import type { ReactNode } from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';
import { Button } from '@/components/ui/Button';

const STAGES = ['Applied', 'Sanctioned', 'Disbursed', 'Closed'] as const;
const OPS_TEAMS = ['Sales', 'Sanction', 'Disbursement', 'Collection'] as const;

const TERMS = [
  { label: 'Interest', value: 'Fixed 12% p.a.' },
  { label: 'Amount', value: '₹50,000 – ₹5,00,000' },
  { label: 'Tenure', value: '30 – 365 days' },
  { label: 'Method', value: 'Simple Interest' },
];

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col bg-[var(--background)] text-[var(--text-primary)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex h-[var(--topbar-height)] max-w-[var(--content-max-width)] items-center justify-between px-4 sm:px-8">
          <BrandLogo href="/" height={28} />
          <nav className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Sign up</Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-[var(--content-max-width)] gap-10 px-4 py-12 sm:px-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(16rem,0.85fr)] lg:items-start lg:gap-16 lg:py-16">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Digital lending platform</p>
          <h1 className="mt-4 max-w-xl text-[32px] font-bold leading-[1.12] tracking-[-0.025em] text-[var(--text-primary)] sm:text-[36px]">
            Apply for a loan.
            <br />
            Track every step.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-[var(--text-secondary)]">
            A guided borrowing experience from application to closure, with transparent loan tracking and role-based operations.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register">
              <Button className="px-6">Start an application</Button>
            </Link>
            <Link href="/login?from=operations">
              <Button variant="secondary" className="px-6">
                Operations login
              </Button>
            </Link>
          </div>
        </div>

        <Lifecycle />
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto grid max-w-[var(--content-max-width)] grid-cols-2 gap-px bg-[var(--border)] sm:grid-cols-4">
          {TERMS.map((item) => (
            <div key={item.label} className="bg-[var(--surface)] px-6 py-6">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">{item.label}</p>
              <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[var(--content-max-width)] px-4 py-12 sm:px-8 lg:py-16">
        <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">How it works</h2>
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <ModuleCard index="01" title="Borrower Portal" href="/register" cta="Start an application">
            Apply through a guided journey, upload your salary slip, configure your loan, and track status in real time.
          </ModuleCard>
          <ModuleCard index="02" title="Operations Dashboard" href="/login?from=operations" cta="Operations login">
            Manage the loan lifecycle through role-based operations.
            <ul className="mt-4 flex flex-wrap gap-2">
              {OPS_TEAMS.map((team) => (
                <li
                  key={team}
                  className="rounded-[var(--radius-pill)] border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]"
                >
                  {team}
                </li>
              ))}
            </ul>
          </ModuleCard>
        </div>
      </section>
    </main>
  );
}

function Lifecycle() {
  return (
    <aside className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-7 shadow-[var(--shadow-md)]">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Loan lifecycle</p>

      <ol className="mt-6 hidden sm:block">
        {STAGES.map((stage, index) => {
          const last = index === STAGES.length - 1;
          return (
            <li key={stage} className="relative pl-7 pb-6 last:pb-0">
              <span className={`absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full ${index === 0 ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'}`} />
              {!last && <span className="absolute left-[4px] top-4 h-[calc(100%-8px)] w-px bg-[var(--border-light)]" aria-hidden />}
              <p className={`text-sm font-semibold ${index === 0 ? 'text-[var(--primary)]' : 'text-[var(--text-secondary)]'}`}>{stage}</p>
            </li>
          );
        })}
      </ol>

      <ol className="mt-6 flex sm:hidden">
        {STAGES.map((stage, index) => {
          const last = index === STAGES.length - 1;
          return (
            <li key={stage} className="flex min-w-0 flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                <span className="h-px min-w-0 flex-1 bg-transparent" />
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${index === 0 ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'}`} />
                <span className={`h-px min-w-0 flex-1 ${last ? 'bg-transparent' : 'bg-[var(--border)]'}`} aria-hidden />
              </div>
              <p className={`mt-3 text-center text-[11px] font-semibold leading-tight ${index === 0 ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
                {stage}
              </p>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

function ModuleCard({
  index,
  title,
  href,
  cta,
  children,
}: {
  index: string;
  title: string;
  href: string;
  cta: string;
  children: ReactNode;
}) {
  return (
    <article className="flex flex-col rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-md)] transition duration-200 hover:shadow-[var(--shadow-lg)] sm:p-7">
      <p className="text-xs font-semibold tabular-nums tracking-[0.08em] text-[var(--text-muted)]">{index}</p>
      <h3 className="mt-2 text-xl font-bold tracking-tight text-[var(--text-primary)]">{title}</h3>
      <div className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">{children}</div>
      <div className="mt-auto pt-6">
        <Link href={href}>
          <Button variant="secondary" size="sm">
            {cta}
          </Button>
        </Link>
      </div>
    </article>
  );
}
