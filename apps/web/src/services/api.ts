const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function fetchJobs() {
  const res = await fetch(`${API_URL}/api/jobs`);
  if (!res.ok) throw new Error('Failed to fetch jobs');
  return res.json();
}

export async function fetchJob(id: string) {
  const res = await fetch(`${API_URL}/api/jobs/${id}`);
  if (!res.ok) throw new Error('Failed to fetch job');
  return res.json();
}

export async function createJob(data: {
  title: string;
  description: string;
  amountUsdc: number;
  freelancerPayoutAddress: string;
}) {
  const res = await fetch(`${API_URL}/api/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create job');
  return res.json();
}

export async function acceptJob(id: string) {
  const res = await fetch(`${API_URL}/api/jobs/${id}/accept`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to accept job');
  return res.json();
}

export async function fundJob(id: string, txHash?: string) {
  const res = await fetch(`${API_URL}/api/jobs/${id}/fund`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ txHash }),
  });
  if (!res.ok) throw new Error('Failed to fund job');
  return res.json();
}

export async function submitWork(id: string, submissionUrl: string) {
  const res = await fetch(`${API_URL}/api/jobs/${id}/submit-work`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ submissionUrl }),
  });
  if (!res.ok) throw new Error('Failed to submit work');
  return res.json();
}

export async function approveWork(id: string) {
  const res = await fetch(`${API_URL}/api/jobs/${id}/approve`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to approve work');
  return res.json();
}

export async function createReleaseIntent(jobId: string) {
  const res = await fetch(`${API_URL}/api/payments/release-intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create release intent');
  return data;
}

export async function verifyAndRelease(paymentIntentId: string, worldProof?: any) {
  const res = await fetch(`${API_URL}/api/payments/verify-and-release`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentIntentId, worldProof }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Release execution rejected');
  return data;
}

export async function fetchAuditTimeline(jobId: string) {
  const res = await fetch(`${API_URL}/api/audit/${jobId}`);
  if (!res.ok) throw new Error('Failed to fetch audit timeline');
  return res.json();
}
