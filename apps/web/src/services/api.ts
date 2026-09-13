const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
let accessTokenProvider: (() => Promise<string | null>) | undefined;

export function configureApiAuth(provider?: () => Promise<string | null>) {
  accessTokenProvider = provider;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const method = options.method || 'GET';

  console.log(
    `%c[ProofPay API] ➡️ ${method} ${endpoint}`,
    'color: #0284c7; font-weight: bold;',
    options.body ? JSON.parse(options.body as string) : ''
  );

  try {
    const token = accessTokenProvider ? await accessTokenProvider() : null;
    const demoUser = localStorage.getItem('proofpay_demo_user_id');
    const headers = new Headers(options.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    else if (demoUser) headers.set('x-proofpay-demo-user', demoUser);
    const res = await fetch(url, { ...options, headers });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data.error || data.message || `Request failed with HTTP status ${res.status}`;
      console.error(
        `%c[ProofPay API Error] ❌ ${method} ${endpoint} (HTTP ${res.status})`,
        'color: #e11d48; font-weight: bold; background-color: #ffe4e6; padding: 2px 6px; border-radius: 4px;',
        {
          status: res.status,
          endpoint,
          responseBody: data,
          error: errorMsg,
        }
      );
      throw new Error(errorMsg);
    }

    console.log(
      `%c[ProofPay API] 🟢 ${method} ${endpoint} (HTTP ${res.status})`,
      'color: #059669; font-weight: bold;',
      data
    );
    return data as T;
  } catch (err: any) {
    console.error(
      `%c[ProofPay Network/API Failure] ${method} ${endpoint}:`,
      'color: #e11d48; font-weight: bold;',
      err.message
    );
    throw err;
  }
}

export async function loginUser(credentials: { email: string; password: string; role?: string }) {
  return request<{ success: boolean; user: any; organization?: any }>('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
}

export async function syncPrivySession(profile: { email?: string; walletAddress?: string; name?: string; role: string }) {
  return request<{ success: boolean; user: any; organization?: any; authMode: 'privy' }>('/api/auth/privy/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
}

export async function fetchSession(role?: string) {
  return request<{ user: any; organization?: any }>(
    `/api/auth/session${role ? `?role=${role}` : ''}`
  );
}

export async function fetchJobs() {
  return request<{ jobs: any[] }>('/api/jobs');
}

export async function fetchJob(id: string) {
  return request<{ job: any; timeline: any[] }>(`/api/jobs/${id}`);
}

export async function createJob(data: {
  title: string;
  description: string;
  amountUsdc: number;
  freelancerPayoutAddress: string;
}) {
  return request<{ job: any }>('/api/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function acceptJob(id: string) {
  return request<{ job: any }>(`/api/jobs/${id}/accept`, { method: 'POST' });
}

export async function fundJob(id: string, txHash?: string) {
  return request<{ job: any }>(`/api/jobs/${id}/fund`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ txHash }),
  });
}

export async function submitWork(id: string, submissionUrl: string) {
  return request<{ job: any }>(`/api/jobs/${id}/submit-work`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ submissionUrl }),
  });
}

export async function approveWork(id: string) {
  return request<{ job: any }>(`/api/jobs/${id}/approve`, { method: 'POST' });
}

export async function createReleaseIntent(jobId: string) {
  return request<any>('/api/payments/release-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId }),
  });
}

export async function verifyAndRelease(paymentIntentId: string, worldProof?: any) {
  return request<any>('/api/payments/verify-and-release', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentIntentId, worldProof }),
  });
}

export async function fetchAuditTimeline(jobId: string) {
  return request<{ jobId: string; jobTitle: string; timeline: any[] }>(`/api/audit/${jobId}`);
}

export async function fetchVaultStatus() {
  return request<{
    success: boolean;
    chainId: number;
    escrowContractAddress: string;
    vaultAddress: string;
    gasBalance: string;
    usdcBalance: string;
    explorerUrl: string;
    privyOrgId: string;
    privyAppId: string;
    status: string;
  }>('/api/payments/vault-status');
}
