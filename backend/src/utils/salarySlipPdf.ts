import { Buffer } from 'node:buffer';

function pdfEscape(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function inr(amount: number): string {
  return `Rs ${amount.toLocaleString('en-IN')}`;
}

export interface SeedSalarySlipFields {
  employeeName: string;
  pan?: string;
  employmentMode?: string;
  monthlySalary?: number;
  period?: string;
}

export function buildSalarySlipPdf(fields: SeedSalarySlipFields): Buffer {
  const salary = fields.monthlySalary ?? 55_000;
  const basic = Math.round(salary * 0.6);
  const hra = Math.round(salary * 0.3);
  const special = salary - basic - hra;
  const pf = Math.round(basic * 0.12);
  const pt = 200;
  const net = salary - pf - pt;
  const period = fields.period ?? 'August 2026';
  const employment =
    fields.employmentMode === 'self-employed'
      ? 'Self-employed'
      : fields.employmentMode === 'unemployed'
        ? 'Unemployed'
        : 'Salaried';

  const rows: Array<{ text: string; size: number; gap: number }> = [
    { text: 'NORTHWIND PAYROLL SERVICES', size: 16, gap: 22 },
    { text: `Salary slip  -  ${period}`, size: 12, gap: 28 },
    { text: `Employee: ${fields.employeeName}`, size: 11, gap: 16 },
    { text: `PAN: ${fields.pan ?? 'Not provided'}`, size: 11, gap: 16 },
    { text: `Employment: ${employment}`, size: 11, gap: 16 },
    { text: `Pay period: ${period}`, size: 11, gap: 28 },
    { text: 'Earnings', size: 12, gap: 18 },
    { text: `Basic                    ${inr(basic)}`, size: 11, gap: 16 },
    { text: `House rent allowance     ${inr(hra)}`, size: 11, gap: 16 },
    { text: `Special allowance        ${inr(special)}`, size: 11, gap: 16 },
    { text: `Gross pay                ${inr(salary)}`, size: 11, gap: 28 },
    { text: 'Deductions', size: 12, gap: 18 },
    { text: `Provident fund           ${inr(pf)}`, size: 11, gap: 16 },
    { text: `Professional tax         ${inr(pt)}`, size: 11, gap: 16 },
    { text: `Net pay                  ${inr(net)}`, size: 12, gap: 28 },
    { text: 'This is a sample document for local testing.', size: 9, gap: 14 },
  ];

  const ops = rows
    .map((row, index) => {
      const line = `/F1 ${row.size} Tf\n(${pdfEscape(row.text)}) Tj`;
      if (index === 0) return `72 740 Td\n${line}`;
      return `0 -${row.gap} Td\n${line}`;
    })
    .join('\n');

  const stream = `BT\n${ops}\nET\n`;
  return assemblePdf(stream);
}

function assemblePdf(contentStream: string): Buffer {
  const objects = [
    '',
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${Buffer.byteLength(contentStream)} >>\nstream\n${contentStream}endstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];

  const header = Buffer.from('%PDF-1.4\n');
  const chunks: Buffer[] = [header];
  const offsets = [0];
  let length = header.length;

  for (let i = 1; i <= 5; i++) {
    offsets[i] = length;
    const object = Buffer.from(`${i} 0 obj\n${objects[i] ?? ''}\nendobj\n`);
    chunks.push(object);
    length += object.length;
  }

  let xref = `xref\n0 6\n0000000000 65535 f \n`;
  for (let i = 1; i <= 5; i++) {
    xref += `${String(offsets[i] ?? 0).padStart(10, '0')} 00000 n \n`;
  }
  xref += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${length}\n%%EOF\n`;
  chunks.push(Buffer.from(xref));
  return Buffer.concat(chunks);
}
