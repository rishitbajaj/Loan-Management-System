const API = process.env.QA_API_URL ?? 'http://localhost:5000/api';
const PASSWORD = 'Password@123';

async function login(email) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  return (await res.json()).data;
}

const col = await login('collection@lms.com');
const bor = await login('borrower@lms.com');
const loans = (await (await fetch(`${API}/loans/me`, { headers: { Authorization: `Bearer ${bor.token}` } })).json()).data.loans;
const loan = loans[0];
console.log('loan', loan.status, loan.outstanding, loan._id);

const body = { utr: 'UTR1234567890123456789012345678901234'.slice(0, 40), amount: loan.outstanding, paidOn: new Date().toISOString().slice(0, 10) };
const res = await fetch(`${API}/loans/${loan._id}/payments`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${col.token}` },
  body: JSON.stringify(body),
});
const json = await res.json();
console.log(res.status, JSON.stringify(json, null, 2));
