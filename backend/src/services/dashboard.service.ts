import { Loan } from '../models/Loan';
import { User } from '../models/User';
import { LOAN_STATUSES, type LoanStatus } from '../types';
import { wallTime } from '../utils/requestTiming';

export interface SalesLead {
  _id: string;
  name: string;
  email: string;
  createdAt: Date;
  profile?: {
    fullName?: string;
    pan?: string;
    monthlySalary?: number;
    employmentMode?: string;
    breStatus: string;
    breFailures: string[];
  };
  hasSalarySlip: boolean;
}

export async function listSalesLeads(): Promise<SalesLead[]> {
  return wallTime(
    'salesLeads',
    User.aggregate<SalesLead>([
      { $match: { role: 'borrower' } },
      {
        $lookup: {
          from: 'loans',
          localField: '_id',
          foreignField: 'borrower',
          pipeline: [{ $project: { _id: 1 } }, { $limit: 1 }],
          as: 'loans',
        },
      },
      { $match: { loans: { $size: 0 } } },
      {
        $project: {
          name: 1,
          email: 1,
          createdAt: 1,
          'profile.fullName': 1,
          'profile.pan': 1,
          'profile.monthlySalary': 1,
          'profile.employmentMode': 1,
          'profile.breStatus': 1,
          'profile.breFailures': 1,
          hasSalarySlip: { $cond: [{ $ifNull: ['$profile.salarySlip', false] }, true, false] },
        },
      },
      { $sort: { createdAt: -1 } },
    ]),
  );
}

export interface DashboardSummary {
  loansByStatus: Record<LoanStatus, number>;
  totalLoans: number;
  totalBorrowers: number;
  leads: number;
  disbursedPrincipal: number;
  outstanding: number;
}

export async function getSummary(): Promise<DashboardSummary> {
  const [statusCounts, totalBorrowers, borrowersWithLoans, money] = await Promise.all([
    wallTime(
      'statusCounts',
      Loan.aggregate<{ _id: LoanStatus; count: number }>([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ),
    wallTime('totalBorrowers', User.countDocuments({ role: 'borrower' })),
    wallTime('borrowersWithLoans', Loan.distinct('borrower')),
    wallTime(
      'money',
      Loan.aggregate<{ disbursedPrincipal: number; outstanding: number }>([
        { $match: { status: { $in: ['disbursed', 'closed'] } } },
        {
          $group: {
            _id: null,
            disbursedPrincipal: { $sum: '$principal' },
            outstanding: { $sum: '$outstanding' },
          },
        },
      ]),
    ),
  ]);

  const loansByStatus = Object.fromEntries(LOAN_STATUSES.map((s) => [s, 0])) as Record<LoanStatus, number>;
  for (const row of statusCounts) loansByStatus[row._id] = row.count;

  return {
    loansByStatus,
    totalLoans: statusCounts.reduce((sum, row) => row.count + sum, 0),
    totalBorrowers,
    leads: Math.max(0, totalBorrowers - borrowersWithLoans.length),
    disbursedPrincipal: money[0]?.disbursedPrincipal ?? 0,
    outstanding: money[0]?.outstanding ?? 0,
  };
}
