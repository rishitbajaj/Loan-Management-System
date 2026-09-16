'use client';

import { Alert, EmptyState, Surface } from '@/components/ui/Card';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/Table';
import { formatCurrency, formatDate } from '@/lib/format';
import { sectionLabelClass } from '@/lib/ui-classes';
import type { Payment } from '@/lib/types';

export function PaymentHistorySection({
  id,
  payments,
  error,
}: {
  id?: string;
  payments: Payment[];
  error: string | null;
}) {
  return (
    <section id={id} aria-labelledby="payment-history-heading">
      <p id="payment-history-heading" className={sectionLabelClass}>
        Payment history
      </p>
      {error && (
        <div className="mt-2">
          <Alert kind="error">{error}</Alert>
        </div>
      )}
      {payments.length === 0 && !error ? (
        <Surface className="mt-2">
          <EmptyState title="No payments recorded yet" description="Repayments will appear here once processed." />
        </Surface>
      ) : (
        <Surface className="mt-2 overflow-hidden p-0">
          <Table>
            <Thead>
              <tr>
                <Th>Date</Th>
                <Th align="right">Amount</Th>
                <Th>UTR</Th>
              </tr>
            </Thead>
            <Tbody>
              {payments.map((payment) => (
                <Tr key={payment._id}>
                  <Td>{formatDate(payment.paidOn)}</Td>
                  <Td align="right">{formatCurrency(payment.amount)}</Td>
                  <Td className="max-w-[140px] truncate font-mono text-xs sm:max-w-none">{payment.utr}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Surface>
      )}
    </section>
  );
}
