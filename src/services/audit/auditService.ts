import { db, generateId, now } from '@/services/storage/db';
import type { AuditEvent } from '@/services/storage/types';

export type AuditAction =
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DISABLED'
  | 'USER_ENABLED'
  | 'PASSWORD_RESET'
  | 'CUSTOMER_CREATED'
  | 'CUSTOMER_UPDATED'
  | 'CUSTOMER_DELETED'
  | 'DEVICE_CREATED'
  | 'DEVICE_UPDATED'
  | 'DEVICE_DELETED'
  | 'JOB_CREATED'
  | 'JOB_UPDATED'
  | 'JOB_STATUS_CHANGED'
  | 'JOB_ASSIGNED'
  | 'QUOTATION_CREATED'
  | 'QUOTATION_UPDATED'
  | 'QUOTATION_STATUS_CHANGED'
  | 'INVOICE_CREATED'
  | 'INVOICE_UPDATED'
  | 'INVOICE_CANCELLED'
  | 'PAYMENT_RECORDED'
  | 'RECEIPT_GENERATED'
  | 'PRODUCT_CREATED'
  | 'PRODUCT_UPDATED'
  | 'STOCK_ADJUSTED'
  | 'STOCK_MOVEMENT'
  | 'DATA_EXPORTED'
  | 'DATA_IMPORTED'
  | 'DATA_CLEARED'
  | 'SETTINGS_UPDATED';

export type EntityType =
  | 'User'
  | 'Customer'
  | 'Device'
  | 'Job'
  | 'Quotation'
  | 'Invoice'
  | 'Payment'
  | 'Receipt'
  | 'Product'
  | 'StockMovement'
  | 'Settings'
  | 'System';

interface LogAuditParams {
  actorUserId: string;
  action: AuditAction;
  entityType: EntityType;
  entityId: string;
  summary: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log an audit event (append-only)
 */
export async function logAudit(params: LogAuditParams): Promise<AuditEvent> {
  const event: AuditEvent = {
    id: generateId(),
    actorUserId: params.actorUserId,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    summary: params.summary,
    metadata: params.metadata,
    createdAt: now(),
  };

  await db.auditEvents.add(event);

  return event;
}

/**
 * Get all audit events (most recent first)
 */
export async function getAuditEvents(limit: number = 100): Promise<AuditEvent[]> {
  return db.auditEvents.orderBy('createdAt').reverse().limit(limit).toArray();
}

/**
 * Get audit events for a specific entity
 */
export async function getEntityAuditEvents(
  entityType: EntityType,
  entityId: string
): Promise<AuditEvent[]> {
  return db.auditEvents
    .where('[entityType+entityId]')
    .equals([entityType, entityId])
    .reverse()
    .toArray();
}

/**
 * Get audit events by actor
 */
export async function getUserAuditEvents(
  userId: string,
  limit: number = 50
): Promise<AuditEvent[]> {
  return db.auditEvents
    .where('actorUserId')
    .equals(userId)
    .reverse()
    .limit(limit)
    .toArray();
}

/**
 * Get audit events by action type
 */
export async function getAuditEventsByAction(
  action: AuditAction,
  limit: number = 50
): Promise<AuditEvent[]> {
  return db.auditEvents
    .where('action')
    .equals(action)
    .reverse()
    .limit(limit)
    .toArray();
}

/**
 * Search audit events by summary
 */
export async function searchAuditEvents(query: string, limit: number = 50): Promise<AuditEvent[]> {
  const lowerQuery = query.toLowerCase();
  return db.auditEvents
    .filter((event) => event.summary.toLowerCase().includes(lowerQuery))
    .reverse()
    .limit(limit)
    .toArray();
}
