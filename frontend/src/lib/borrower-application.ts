import { addCalendarDays, formatCalendarDateDisplay } from './loanMath';
import type { Loan, LoanStatus, StatusHistoryEntry, UserDetail } from './types';

export interface ApplicationCheckItem {
  label: string;
  detail: string;
  complete: boolean;
}

/** Friendly borrower-facing labels mapped from backend loan statuses. */
export const BORROWER_STATUS_LABELS: Record<LoanStatus, string> = {
  applied: 'Under review',
  sanctioned: 'Sanction approved',
  rejected: 'Rejected',
  disbursed: 'Loan active',
  closed: 'Closed',
};

export const BORROWER_HERO_TITLES: Record<LoanStatus, string> = {
  applied: 'Under review',
  sanctioned: 'Sanction approved',
  rejected: 'Application not approved',
  disbursed: 'Loan active',
  closed: 'Loan closed',
};

export type JourneyStageState = 'completed' | 'current' | 'upcoming' | 'error';

export interface JourneyStage {
  id: string;
  label: string;
  description?: string;
  timestamp?: string;
  state: JourneyStageState;
}

export interface NextStepItem {
  title: string;
  body: string;
}

export function getApplicationChecklist(me: UserDetail | null, loanConfigured = true): ApplicationCheckItem[] {
  const brePassed = me?.profile?.breStatus === 'passed';
  const hasSlip = !!me?.profile?.salarySlip;

  return [
    {
      label: 'Personal details',
      detail: brePassed ? 'Completed' : 'Incomplete',
      complete: brePassed,
    },
    {
      label: 'Documents',
      detail: hasSlip ? 'Salary slip uploaded' : 'Pending',
      complete: hasSlip,
    },
    {
      label: 'Loan configuration',
      detail: loanConfigured ? 'Completed' : 'Incomplete',
      complete: loanConfigured,
    },
  ];
}

export function borrowerStatusDescription(status: LoanStatus): string {
  switch (status) {
    case 'applied':
      return 'Your application has been submitted and is currently being reviewed.';
    case 'sanctioned':
      return 'Your application has been approved and is ready for the next stage.';
    case 'rejected':
      return 'Your application was not approved at this stage.';
    case 'disbursed':
      return 'Your loan has been disbursed and is now active.';
    case 'closed':
      return 'Your loan has been fully closed.';
    default:
      return 'Track your application progress below.';
  }
}

export function historyEntry(loan: Loan, to: LoanStatus): StatusHistoryEntry | undefined {
  return loan.statusHistory.find((entry) => entry.to === to);
}

/** Returns a backend timestamp only — never synthesised on the frontend. */
export function realStatusTimestamp(loan: Loan, status: LoanStatus): string | undefined {
  const entry = historyEntry(loan, status);
  if (entry?.at) return entry.at;

  switch (status) {
    case 'applied':
      return loan.createdAt;
    case 'sanctioned':
      return loan.sanctionedAt;
    case 'disbursed':
      return loan.disbursedAt;
    case 'closed':
      return loan.closedAt;
    default:
      return undefined;
  }
}

export function submittedTimestamp(loan: Loan): string | undefined {
  return realStatusTimestamp(loan, 'applied');
}

export function getLoanJourneyTimeline(loan: Loan): JourneyStage[] {
  if (loan.status === 'rejected') {
    const rejectedEntry = historyEntry(loan, 'rejected');
    return [
      {
        id: 'submitted',
        label: 'Application submitted',
        state: 'completed',
        timestamp: realStatusTimestamp(loan, 'applied'),
      },
      {
        id: 'reviewed',
        label: 'Application reviewed',
        state: 'completed',
      },
      {
        id: 'rejected',
        label: 'Application not approved',
        description: loan.rejectionReason,
        state: 'error',
        timestamp: rejectedEntry?.at,
      },
    ];
  }

  const currentStageIndex = (() => {
    switch (loan.status) {
      case 'applied':
        return 1;
      case 'sanctioned':
        return 3;
      case 'disbursed':
        return 4;
      case 'closed':
        return 5;
      default:
        return 0;
    }
  })();

  const stages: Omit<JourneyStage, 'state' | 'timestamp' | 'description'>[] = [
    { id: 'submitted', label: 'Application submitted' },
    { id: 'review', label: 'Under review' },
    { id: 'sanction', label: 'Sanction approved' },
    { id: 'disbursement', label: 'Disbursement' },
    { id: 'closed', label: 'Loan closed' },
  ];

  return stages.map((stage, index) => {
    let state: JourneyStageState = 'upcoming';
    let description: string | undefined;
    let timestamp: string | undefined;

    if (loan.status === 'closed' || index < currentStageIndex) {
      state = 'completed';
    } else if (index === currentStageIndex) {
      state = 'current';
    }

    switch (stage.id) {
      case 'submitted':
        timestamp = state !== 'upcoming' ? realStatusTimestamp(loan, 'applied') : undefined;
        break;
      case 'review':
        if (state === 'completed') {
          timestamp = realStatusTimestamp(loan, 'sanctioned');
        } else if (state === 'current') {
          description = 'Awaiting sanction';
        }
        break;
      case 'sanction':
        if (state === 'completed') {
          timestamp = realStatusTimestamp(loan, 'sanctioned');
        }
        break;
      case 'disbursement':
        if (state === 'completed') {
          timestamp = realStatusTimestamp(loan, 'disbursed');
        } else if (state === 'current') {
          description = loan.status === 'sanctioned' ? 'Awaiting disbursement' : undefined;
        }
        break;
      case 'closed':
        if (state === 'completed') {
          timestamp = realStatusTimestamp(loan, 'closed');
        } else if (state === 'current') {
          description = 'Awaiting full repayment';
        }
        break;
    }

    return { ...stage, state, description, timestamp };
  });
}

export function getWhatHappensNextSteps(status: LoanStatus): NextStepItem[] {
  switch (status) {
    case 'applied':
      return [
        { title: 'Application review', body: 'Your application is being reviewed by the sanction team.' },
        { title: 'Sanction decision', body: 'A sanction approval or rejection will be recorded on your application.' },
        { title: 'Disbursement if approved', body: 'If approved, your loan can proceed to disbursement when ready.' },
      ];
    case 'sanctioned':
      return [
        { title: 'Disbursement processing', body: 'Your approved loan will move to disbursement when processed.' },
        { title: 'Loan becomes active', body: 'After disbursement, your loan becomes active and repayments apply.' },
      ];
    case 'disbursed':
      return [
        { title: 'Make scheduled repayments', body: 'Repayments reduce your outstanding balance over the loan tenure.' },
        { title: 'Track your loan', body: 'Monitor payments and outstanding balance on this page.' },
        { title: 'Loan closure', body: 'Your loan closes after repayment is completed in full.' },
      ];
    default:
      return [];
  }
}

export function isEstimateStatus(status: LoanStatus): boolean {
  return status === 'applied';
}

export function loanEndDateLabel(loan: Loan): { label: string; value: string } | null {
  const startIso = loan.disbursedAt?.slice(0, 10) ?? loan.createdAt?.slice(0, 10);
  if (!startIso) return null;

  const endIso = addCalendarDays(startIso, loan.tenureDays);
  const prefix = loan.disbursedAt ? 'Expected end date' : 'Estimated end date';
  return { label: prefix, value: formatCalendarDateDisplay(endIso) };
}

export function canReapply(status: LoanStatus): boolean {
  return status === 'rejected' || status === 'closed';
}

export function showWhatHappensNext(status: LoanStatus): boolean {
  return status === 'applied' || status === 'sanctioned' || status === 'disbursed';
}
