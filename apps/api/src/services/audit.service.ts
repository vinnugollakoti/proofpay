import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/store.js';
import { AuditEvent } from '../types/index.js';

export class AuditService {
  static recordEvent(
    jobId: string,
    eventType: string,
    metadata: Record<string, any> = {},
    actorAddress?: string,
    actorRole?: string,
    paymentIntentId?: string
  ): AuditEvent {
    const event: AuditEvent = {
      id: uuidv4(),
      jobId,
      paymentIntentId,
      eventType,
      actorAddress,
      actorRole,
      metadata,
      timestamp: new Date().toISOString(),
    };

    db.auditEvents.push(event);
    return event;
  }

  static getJobTimeline(jobId: string): AuditEvent[] {
    return db.auditEvents
      .filter((e) => e.jobId === jobId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }
}
