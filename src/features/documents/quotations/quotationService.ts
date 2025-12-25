import { db, generateId, now } from '@/services/storage/db';
import type { Quotation, QuotationStatus } from '@/services/storage/types';
import type { QuotationCreate } from '@/services/storage/schemas';
import { NotFoundError, BusinessRuleError } from '@/lib/errors';
import { logAudit } from '@/services/audit/auditService';
import { generateDocumentNumber } from '@/services/documents/numberingService';
import { createLineItems, calculateDocumentTotals } from '../lineItems';
import { isExpired } from '@/lib/time';

const STATUS_LABELS: Record<QuotationStatus, string> = {
  draft: 'Draf',
  sent: 'Dihantar',
  accepted: 'Diterima',
  rejected: 'Ditolak',
  expired: 'Tamat Tempoh',
};

export function getStatusLabel(status: QuotationStatus): string {
  return STATUS_LABELS[status];
}

/**
 * Get all quotations (newest first)
 */
export async function getQuotations(): Promise<Quotation[]> {
  return db.quotations
    .filter((q) => !q.deletedAt)
    .reverse()
    .toArray();
}

/**
 * Get quotations by status
 */
export async function getQuotationsByStatus(status: QuotationStatus): Promise<Quotation[]> {
  return db.quotations
    .where('status')
    .equals(status)
    .filter((q) => !q.deletedAt)
    .reverse()
    .toArray();
}

/**
 * Get quotation by ID
 */
export async function getQuotation(id: string): Promise<Quotation> {
  const quotation = await db.quotations.get(id);
  if (!quotation || quotation.deletedAt) {
    throw new NotFoundError('Sebutharga', id);
  }
  return quotation;
}

/**
 * Get quotation by number
 */
export async function getQuotationByNumber(quotationNo: string): Promise<Quotation | null> {
  return db.quotations.where('quotationNo').equals(quotationNo).first() || null;
}

/**
 * Get quotations for a job
 */
export async function getQuotationsForJob(jobId: string): Promise<Quotation[]> {
  return db.quotations
    .where('jobId')
    .equals(jobId)
    .filter((q) => !q.deletedAt)
    .toArray();
}

/**
 * Create a new quotation
 */
export async function createQuotation(
  data: QuotationCreate,
  userId: string
): Promise<Quotation> {
  const timestamp = now();
  const quotationNo = await generateDocumentNumber('quotation');

  // Create line items
  const lineItems = createLineItems(data.lineItems);

  // Calculate totals
  const totals = calculateDocumentTotals(lineItems, data.discountCents, data.taxCents);

  const quotation: Quotation = {
    id: generateId(),
    quotationNo,
    jobId: data.jobId,
    customerId: data.customerId,
    deviceId: data.deviceId,
    status: 'draft',
    validUntil: data.validUntil,
    lineItems,
    subtotalCents: totals.subtotalCents,
    discountCents: totals.discountCents,
    taxCents: totals.taxCents,
    totalCents: totals.totalCents,
    createdByUserId: userId,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.quotations.add(quotation);

  await logAudit({
    actorUserId: userId,
    action: 'QUOTATION_CREATED',
    entityType: 'Quotation',
    entityId: quotation.id,
    summary: `Sebutharga baru: ${quotationNo}`,
    metadata: { quotationNo, customerId: data.customerId, jobId: data.jobId },
  });

  return quotation;
}

/**
 * Update quotation status
 */
export async function updateQuotationStatus(
  id: string,
  newStatus: QuotationStatus,
  userId: string
): Promise<Quotation> {
  const quotation = await getQuotation(id);

  // Validate status transitions
  const currentStatus = quotation.status;
  const validTransitions: Record<QuotationStatus, QuotationStatus[]> = {
    draft: ['sent', 'accepted', 'rejected'],
    sent: ['accepted', 'rejected', 'expired'],
    accepted: [],
    rejected: [],
    expired: [],
  };

  if (!validTransitions[currentStatus].includes(newStatus)) {
    throw new BusinessRuleError(
      `Tidak boleh tukar status dari "${getStatusLabel(currentStatus)}" ke "${getStatusLabel(newStatus)}"`
    );
  }

  const updated: Quotation = {
    ...quotation,
    status: newStatus,
    updatedAt: now(),
  };

  await db.quotations.put(updated);

  await logAudit({
    actorUserId: userId,
    action: 'QUOTATION_STATUS_CHANGED',
    entityType: 'Quotation',
    entityId: id,
    summary: `Status sebutharga ${quotation.quotationNo} ditukar: ${getStatusLabel(currentStatus)} -> ${getStatusLabel(newStatus)}`,
    metadata: { from: currentStatus, to: newStatus },
  });

  return updated;
}

/**
 * Update quotation line items and totals
 */
export async function updateQuotation(
  id: string,
  data: Partial<QuotationCreate>,
  userId: string
): Promise<Quotation> {
  const quotation = await getQuotation(id);

  // Only draft quotations can be edited
  if (quotation.status !== 'draft') {
    throw new BusinessRuleError('Hanya sebutharga dalam status Draf boleh diedit');
  }

  const lineItems = data.lineItems ? createLineItems(data.lineItems) : quotation.lineItems;
  const discountCents = data.discountCents ?? quotation.discountCents;
  const taxCents = data.taxCents ?? quotation.taxCents;
  const totals = calculateDocumentTotals(lineItems, discountCents, taxCents);

  const updated: Quotation = {
    ...quotation,
    jobId: data.jobId ?? quotation.jobId,
    customerId: data.customerId ?? quotation.customerId,
    deviceId: data.deviceId ?? quotation.deviceId,
    validUntil: data.validUntil ?? quotation.validUntil,
    lineItems,
    subtotalCents: totals.subtotalCents,
    discountCents: totals.discountCents,
    taxCents: totals.taxCents,
    totalCents: totals.totalCents,
    updatedAt: now(),
  };

  await db.quotations.put(updated);

  await logAudit({
    actorUserId: userId,
    action: 'QUOTATION_UPDATED',
    entityType: 'Quotation',
    entityId: id,
    summary: `Sebutharga ${quotation.quotationNo} dikemaskini`,
  });

  return updated;
}

/**
 * Check and mark expired quotations
 */
export async function checkExpiredQuotations(): Promise<number> {
  const quotations = await db.quotations
    .where('status')
    .equals('sent')
    .toArray();

  let expiredCount = 0;

  for (const q of quotations) {
    if (q.validUntil && isExpired(q.validUntil)) {
      await db.quotations.update(q.id, {
        status: 'expired',
        updatedAt: now(),
      });
      expiredCount++;
    }
  }

  return expiredCount;
}

/**
 * Search quotations
 */
export async function searchQuotations(query: string): Promise<Quotation[]> {
  const upperQuery = query.toUpperCase();
  return db.quotations
    .filter((q) => !q.deletedAt && q.quotationNo.includes(upperQuery))
    .toArray();
}
