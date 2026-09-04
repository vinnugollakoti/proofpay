import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/store.js';
import { getPrisma } from '../db/prisma.js';
import { AuditEvent } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class AuditService {
  static async recordEvent(
    jobId: string,
    eventType: string,
    metadata: Record<string, any> = {},
    actorAddress?: string,
    actorRole?: string,
    paymentIntentId?: string
  ): Promise<AuditEvent> {
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

    // Store in memory cache
    db.auditEvents.push(event);

    // Persist to Supabase PostgreSQL via Prisma
    const prisma = getPrisma();
    if (prisma) {
      try {
        await prisma.auditEvent.create({
          data: {
            id: event.id,
            jobId,
            paymentIntentId,
            eventType,
            actorAddress,
            actorRole,
            metadata: metadata || {},
            timestamp: new Date(event.timestamp),
          },
        });
      } catch (err: any) {
        logger.dbError(`Failed to persist audit event to Supabase: ${err.message}`);
      }
    }

    return event;
  }

  static async getJobTimeline(jobId: string): Promise<AuditEvent[]> {
    const prisma = getPrisma();
    if (prisma) {
      try {
        const events = await prisma.auditEvent.findMany({
          where: { jobId },
          orderBy: { timestamp: 'asc' },
        });
        if (events.length > 0) {
          return events.map((e: any) => ({
            id: e.id,
            jobId: e.jobId,
            paymentIntentId: e.paymentIntentId || undefined,
            eventType: e.eventType,
            actorAddress: e.actorAddress || undefined,
            actorRole: e.actorRole || undefined,
            metadata: typeof e.metadata === 'string' ? JSON.parse(e.metadata) : (e.metadata || {}),
            timestamp: e.timestamp.toISOString(),
          }));
        }
      } catch (err: any) {
        logger.dbError(`Failed to fetch audit timeline from Supabase: ${err.message}`);
      }
    }

    return db.auditEvents
      .filter((e) => e.jobId === jobId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }
}
