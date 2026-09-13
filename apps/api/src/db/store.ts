import { User, Organization, Job, PaymentIntent, VerificationRecord, AuditEvent } from '../types/index.js';

/**
 * In-memory data store with seeded demo data.
 *
 * This runs without any database — just start the server.
 * When Prisma + Supabase are configured, services can call
 * getPrisma() from './prisma.js' for persistent storage.
 */
class DataStore {
  public users: Map<string, User> = new Map();
  public organizations: Map<string, Organization> = new Map();
  public jobs: Map<string, Job> = new Map();
  public paymentIntents: Map<string, PaymentIntent> = new Map();
  public verifications: Map<string, VerificationRecord> = new Map();
  public auditEvents: AuditEvent[] = [];

  constructor() {
    this.seedDefaultData();
  }

  private seedDefaultData() {
    const orgId = 'org-acme-design';
    this.organizations.set(orgId, {
      id: orgId,
      name: 'ACME Design Studio',
      privyOrgId: 'privy-org-acme',
      walletAddress: '0x37Da1f17986e4DC6d4E8D86713791698F07c8099',
      maxReleaseLimitUsdc: 2500,
      createdAt: new Date().toISOString(),
    });

    const clientUserId = 'user-client-alice';
    this.users.set(clientUserId, {
      id: clientUserId,
      privyUserId: 'did:privy:alice',
      walletAddress: '0xa11ce00000000000000000000000000000000001',
      name: 'Alice (ACME Design)',
      email: 'client@acmedesign.com',
      password: 'password123',
      role: 'CLIENT',
      organizationId: orgId,
      createdAt: new Date().toISOString(),
    });

    const freelancerUserId = 'user-freelancer-bob';
    this.users.set(freelancerUserId, {
      id: freelancerUserId,
      privyUserId: 'did:privy:bob',
      walletAddress: '0xb0b0000000000000000000000000000000000002',
      name: 'Bob (Senior Web3 Engineer)',
      email: 'freelancer@bobdesigns.io',
      password: 'password123',
      role: 'FREELANCER',
      createdAt: new Date().toISOString(),
    });

    const sampleJobId = 'job-demo-landing-page';
    this.jobs.set(sampleJobId, {
      id: sampleJobId,
      title: 'Design Web3 Fintech Landing Page',
      description: 'Create high-converting landing page UI/UX for ProofPay payments protocol.',
      clientId: clientUserId,
      organizationId: orgId,
      freelancerId: freelancerUserId,
      freelancerPayoutAddress: '0xb0b0000000000000000000000000000000000002',
      amountUsdc: 10,
      status: 'APPROVED',
      escrowId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      submissionUrl: 'https://figma.com/@bob/proofpay-mockups',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date().toISOString(),
    });

    this.auditEvents.push({
      id: 'audit-1',
      jobId: sampleJobId,
      eventType: 'JOB_CREATED',
      actorAddress: '0xa11ce00000000000000000000000000000000001',
      actorRole: 'CLIENT',
      metadata: { amountUsdc: 500 },
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    });

    this.auditEvents.push({
      id: 'audit-2',
      jobId: sampleJobId,
      eventType: 'ESCROW_FUNDED',
      actorAddress: '0xa11ce00000000000000000000000000000000001',
      actorRole: 'CLIENT',
      metadata: { amountUsdc: 500, depositMethod: 'Authorized Escrow Deposit' },
      timestamp: new Date(Date.now() - 3000000).toISOString(),
    });

    this.auditEvents.push({
      id: 'audit-3',
      jobId: sampleJobId,
      eventType: 'WORK_SUBMITTED',
      actorAddress: '0xb0b0000000000000000000000000000000000002',
      actorRole: 'FREELANCER',
      metadata: { submissionUrl: 'https://figma.com/@bob/proofpay-mockups' },
      timestamp: new Date(Date.now() - 1800000).toISOString(),
    });

    this.auditEvents.push({
      id: 'audit-4',
      jobId: sampleJobId,
      eventType: 'WORK_APPROVED',
      actorAddress: '0xa11ce00000000000000000000000000000000001',
      actorRole: 'CLIENT',
      metadata: { note: 'Work verified by client. Ready for release.' },
      timestamp: new Date(Date.now() - 600000).toISOString(),
    });
  }
}

export const db = new DataStore();
