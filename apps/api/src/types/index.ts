export type UserRole = 'CLIENT' | 'FREELANCER' | 'ADMIN';

export interface User {
  id: string;
  privyUserId: string;
  walletAddress: string;
  name?: string;
  email?: string;
  /** Present only on seeded local demo records; never returned by the API. */
  password?: string;
  role: UserRole;
  organizationId?: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  privyOrgId?: string;
  walletAddress: string;
  maxReleaseLimitUsdc: number;
  createdAt: string;
}

export type JobStatus =
  | 'CREATED'
  | 'ACCEPTED'
  | 'FUNDED'
  | 'WORK_SUBMITTED'
  | 'APPROVED'
  | 'COMPLETED'
  | 'REFUNDED';

export interface Job {
  id: string;
  title: string;
  description: string;
  clientId: string;
  organizationId?: string;
  freelancerId?: string;
  freelancerPayoutAddress: string;
  amountUsdc: number;
  status: JobStatus;
  escrowId?: string; // onchain bytes32
  submissionUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface RiskDecision {
  riskLevel: RiskLevel;
  requiresHumanVerification: boolean;
  reasons: string[];
}

export type PaymentIntentStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'EXECUTED'
  | 'BLOCKED'
  | 'EXPIRED';

export interface PaymentIntent {
  id: string;
  jobId: string;
  clientId: string;
  recipientAddress: string;
  amountUsdc: number;
  riskLevel: RiskLevel;
  requiresHumanVerification: boolean;
  signalHash: string;
  status: PaymentIntentStatus;
  expiresAt: string;
  createdAt: string;
}

export interface WorldProofPayload {
  merkle_root: string;
  nullifier_hash: string;
  proof: string;
  credential_type?: string;
  verification_level?: string;
}

export interface VerificationRecord {
  id: string;
  paymentIntentId: string;
  nullifierHash: string;
  merkleRoot: string;
  verificationLevel: string;
  verifiedAt: string;
  status: 'VALID' | 'REPLAY_DETECTED' | 'EXPIRED' | 'FAILED';
}

export interface AuditEvent {
  id: string;
  jobId: string;
  paymentIntentId?: string;
  eventType: string;
  actorAddress?: string;
  actorRole?: string;
  metadata: Record<string, any>;
  timestamp: string;
}
