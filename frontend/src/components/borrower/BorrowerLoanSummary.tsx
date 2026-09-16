import { isEstimateStatus, loanEndDateLabel } from '@/lib/borrower-application';
import { formatCurrency, formatDate } from '@/lib/format';
import { sectionLabelClass } from '@/lib/ui-classes';
import type { Loan } from '@/lib/types';
import { Surface } from '@/components/ui/Card';

export function BorrowerLoanSummary({ loan }: { loan: Loan }) {
  const estimate = isEstimateStatus(loan.status);
  const endDate = loanEndDateLabel(loan);
  const heading =
    loan.status === 'disbursed' ? 'Active loan' : loan.status === 'closed' ? 'Closed loan' : 'Loan summary';

  return (
    <Surface className="p-4 sm:p-5">
      <h2 className={sectionLabelClass}>{heading}</h2>
      <dl className="mt-3 space-y-3 text-sm">
        <SummaryRow label="Loan amount" value={formatCurrency(loan.principal)} strong />
        <SummaryRow label="Interest rate" value={`${loan.interestRate}% p.a.`} />
        <SummaryRow label="Tenure" value={`${loan.tenureDays} days`} />
        <SummaryRow
          label={estimate ? 'Estimated total repayment' : 'Total repayment'}
          value={formatCurrency(loan.totalRepayment)}
          strong
        />
        {endDate && <SummaryRow label={endDate.label} value={endDate.value} />}
        {(loan.status === 'disbursed' || loan.status === 'closed') && (
          <>
            {loan.disbursedAt && <SummaryRow label="Start date" value={formatDate(loan.disbursedAt)} />}
            <SummaryRow label="Total paid" value={formatCurrency(loan.totalPaid)} />
            {(loan.status === 'disbursed' || loan.outstanding > 0) && (
              <SummaryRow
                label="Outstanding"
                value={formatCurrency(loan.outstanding)}
                strong
                primary={loan.outstanding > 0}
              />
            )}
          </>
        )}
        {loan.status === 'closed' && loan.closedAt && <SummaryRow label="Closed date" value={formatDate(loan.closedAt)} />}
      </dl>
    </Surface>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
  primary = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
  primary?: boolean;
}) {
  const valueClass = primary
    ? 'text-lg font-bold tabular-nums text-[var(--primary)]'
    : strong
      ? 'font-semibold tabular-nums text-[var(--text-primary)]'
      : 'font-medium tabular-nums text-[var(--text-secondary)]';

  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-[var(--text-muted)]">{label}</dt>
      <dd className={`text-right ${valueClass}`}>{value}</dd>
    </div>
  );
}
