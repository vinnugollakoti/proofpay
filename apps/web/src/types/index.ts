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
  escrowId?: string;
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

export interface PaymentIntent {
  id: string;
  jobId: string;
  clientId: string;
  recipientAddress: string;
  amountUsdc: number;
  riskLevel: RiskLevel;
  requiresHumanVerification: boolean;
  signalHash: string;
  status: 'PENDING' | 'VERIFIED' | 'EXECUTED' | 'BLOCKED' | 'EXPIRED';
  expiresAt: string;
  createdAt: string;
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
