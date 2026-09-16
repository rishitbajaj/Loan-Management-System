'use client';

import { Modal } from '@/components/ui/Modal';
import { compareLoanPlans, formatCalendarDateDisplay, type LoanPlan } from '@/lib/loanMath';
import { formatCurrency } from '@/lib/format';

interface CompareTenuresModalProps {
  open: boolean;
  onClose: () => void;
  principal: number;
  selectedTenure: number;
  startDate: string;
  tenures: readonly number[];
}

export function CompareTenuresModal({ open, onClose, principal, selectedTenure, startDate, tenures }: CompareTenuresModalProps) {
  const plans = compareLoanPlans(principal, tenures, startDate);

  return (
    <Modal open={open} title="Compare tenure options" description="Same loan amount and rate across tenure choices." onClose={onClose}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="border-b border-[var(--border-light)] text-left">
              <th className="pb-3 pr-3 font-semibold text-[var(--text-muted)]" scope="col" />
              {plans.map((plan) => (
                <th
                  key={plan.tenureDays}
                  scope="col"
                  className={`pb-3 px-2 font-semibold ${plan.tenureDays === selectedTenure ? 'text-[var(--primary)]' : 'text-[var(--text-primary)]'}`}
                >
                  {plan.tenureDays} days
                  {plan.tenureDays === selectedTenure && (
                    <span className="mt-1 block text-[11px] font-medium text-[var(--primary)]">Selected</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-light)]">
            <CompareRow label="Loan amount" plans={plans} value={(p) => formatCurrency(p.principal, true)} />
            <CompareRow label="Estimated interest" plans={plans} value={(p) => formatCurrency(p.interest)} highlight={selectedTenure} />
            <CompareRow label="Estimated total" plans={plans} value={(p) => formatCurrency(p.totalRepayment)} highlight={selectedTenure} />
            <CompareRow label="Expected end date" plans={plans} value={(p) => formatCalendarDateDisplay(p.endDate)} highlight={selectedTenure} />
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-[var(--text-muted)]">
        Longer tenure may reduce periodic repayment but can increase total interest.
      </p>
    </Modal>
  );
}

function CompareRow({
  label,
  plans,
  value,
  highlight,
}: {
  label: string;
  plans: LoanPlan[];
  value: (plan: LoanPlan) => string;
  highlight?: number;
}) {
  return (
    <tr>
      <th scope="row" className="py-3 pr-3 font-medium text-[var(--text-muted)]">
        {label}
      </th>
      {plans.map((plan) => (
        <td
          key={plan.tenureDays}
          className={`py-3 px-2 tabular-nums ${plan.tenureDays === highlight ? 'font-semibold text-[var(--primary)]' : 'text-[var(--text-primary)]'}`}
        >
          {value(plan)}
        </td>
      ))}
    </tr>
  );
}
