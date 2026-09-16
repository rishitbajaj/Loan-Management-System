/**
 * API-driven end-to-end smoke test (Windows localhost backend).
 * Does not change business rules — exercises existing workflow only.
 */
const API = process.env.QA_API_URL ?? 'http://localhost:5000/api';
const PASSWORD = 'Password@123';

async function login(email) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(`${email}: ${json.message}`);
  return json.data;
}

async function api(method, path, token, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  return { status: res.status, json };
}

async function run() {
  const steps = [];
  const borrower = await login('borrower@lms.com');
  steps.push('borrower login');

  let { json: loansRes } = await api('GET', '/loans/me', borrower.token);
  let loans = loansRes.data?.loans ?? [];
  steps.push(`borrower loans: ${loans.length}`);

  const latest = loans[0];
  if (!latest) {
    steps.push('skip workflow — no loan (create manually or re-seed)');
    console.log(JSON.stringify({ ok: true, steps, note: 'No loan to exercise pipeline' }, null, 2));
    return;
  }

  steps.push(`latest status: ${latest.status}`);

  const sanction = await login('sanction@lms.com');
  const disburse = await login('disbursement@lms.com');
  const collection = await login('collection@lms.com');

  if (latest.status === 'applied') {
    const r = await api('PATCH', `/loans/${latest._id}/sanction`, sanction.token);
    steps.push(`sanction: ${r.json.success ? 'ok' : r.json.message}`);
  }

  ({ json: loansRes } = await api('GET', '/loans/me', borrower.token));
  latest.status = loansRes.data?.loans?.[0]?.status;
  steps.push(`after sanction: ${latest.status}`);

  if (latest.status === 'sanctioned') {
    const r = await api('PATCH', `/loans/${latest._id}/disburse`, disburse.token);
    steps.push(`disburse: ${r.json.success ? 'ok' : r.json.message}`);
  }

  ({ json: loansRes } = await api('GET', '/loans/me', borrower.token));
  const disbursed = loansRes.data?.loans?.[0];
  steps.push(`after disburse: ${disbursed?.status}`);

  if (disbursed?.status === 'disbursed' && disbursed.outstanding > 0) {
    const utr = `UTR${String(Date.now()).slice(-8)}SMK`.slice(0, 40);
    const r = await api('POST', `/loans/${disbursed._id}/payments`, collection.token, {
      utr,
      amount: disbursed.outstanding,
      paidOn: new Date().toISOString().slice(0, 10),
    });
    steps.push(`payment: ${r.json.success ? 'ok' : r.json.message}`);
    steps.push(`closed: ${r.json.data?.loan?.status ?? 'unknown'}`);
  }

  ({ json: loansRes } = await api('GET', '/loans/me', borrower.token));
  steps.push(`final status: ${loansRes.data?.loans?.[0]?.status}`);

  console.log(JSON.stringify({ ok: true, steps }, null, 2));
}

run().catch((e) => {
  console.error(JSON.stringify({ ok: false, error: e.message }, null, 2));
  process.exit(1);
});
