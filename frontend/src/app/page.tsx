import Link from 'next/link';
import { Button } from '@/components/ui/Button';

const FEATURES = [
  { title: 'Borrower portal', text: 'Sign up, pass the eligibility check, upload a salary slip and apply in minutes.' },
  { title: 'Fixed 12% p.a.', text: 'Simple interest on Rs 50,000 - 5,00,000 for 30 - 365 days, calculated live.' },
  { title: 'Operations dashboard', text: 'Sales, Sanction, Disbursement and Collection modules with role-based access.' },
];

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="text-lg font-semibold text-indigo-700">LMS</span>
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

      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-16 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Loan Management System</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Apply for a loan and track it from application to closure.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-slate-600">
          Borrowers apply through a guided four-step form. Internal executives manage each stage of the loan lifecycle from a single dashboard.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/register">
            <Button>Start an application</Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary">Executive login</Button>
          </Link>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-slate-900">{f.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{f.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
