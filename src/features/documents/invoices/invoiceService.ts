import { db, generateId, now } from '@/services/storage/db';
import type { Invoice, InvoiceStatus } from '@/services/storage/types';
import type { InvoiceCreate } from '@/services/storage/schemas';
import { NotFoundError, BusinessRuleError } from '@/lib/errors';
import { logAudit } from '@/services/audit/auditService';
import { generateDocumentNumber } from '@/services/documents/numberingService';
import { createLineItems, calculateDocumentTotals } from '../lineItems';
import { getQuotation } from '../quotations/quotationService';

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  unpaid: 'Belum Dibayar',
  partially_paid: 'Separuh Dibayar',
  paid: 'Dibayar',
  cancelled: 'Dibatalkan',
};

export function getStatusLabel(status: InvoiceStatus): string {
  return STATUS_LABELS[status];
}

/**
 * Get all invoices (newest first)
 */
export async function getInvoices(): Promise<Invoice[]> {
  return db.invoices
    .filter((i) => !i.deletedAt)
    .reverse()
    .toArray();
}

/**
 * Get invoices by status
 */
export async function getInvoicesByStatus(status: InvoiceStatus): Promise<Invoice[]> {
  return db.invoices
    .where('status')
    .equals(status)
    .filter((i) => !i.deletedAt)
    .reverse()
    .toArray();
}

/**
 * Get unpaid/partially paid invoices
 */
export async function getOutstandingInvoices(): Promise<Invoice[]> {
  return db.invoices
    .filter((i) => !i.deletedAt && (i.status === 'unpaid' || i.status === 'partially_paid'))
    .reverse()
    .toArray();
}

/**
 * Get invoice by ID
 */
export async function getInvoice(id: string): Promise<Invoice> {
  const invoice = await db.invoices.get(id);
  if (!invoice || invoice.deletedAt) {
    throw new NotFoundError('Invois', id);
  }
  return invoice;
}

/**
 * Get invoice by number
 */
export async function getInvoiceByNumber(invoiceNo: string): Promise<Invoice | null> {
  return db.invoices.where('invoiceNo').equals(invoiceNo).first() || null;
}

/**
 * Create a new invoice
 */
export async function createInvoice(
  data: InvoiceCreate,
  userId: string
): Promise<Invoice> {
  const timestamp = now();
  const invoiceNo = await generateDocumentNumber('invoice');

  const lineItems = createLineItems(data.lineItems);
  const totals = calculateDocumentTotals(lineItems, data.discountCents, data.taxCents);

  const invoice: Invoice = {
    id: generateId(),
    invoiceNo,
    quotationId: data.quotationId,
    jobId: data.jobId,
    customerId: data.customerId,
    deviceId: data.deviceId,
    status: 'unpaid',
    dueDate: data.dueDate,
    lineItems,
    subtotalCents: totals.subtotalCents,
    discountCents: totals.discountCents,
    taxCents: totals.taxCents,
    totalCents: totals.totalCents,
    amountPaidCents: 0,
    balanceCents: totals.totalCents,
    createdByUserId: userId,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.invoices.add(invoice);

  await logAudit({
    actorUserId: userId,
    action: 'INVOICE_CREATED',
    entityType: 'Invoice',
    entityId: invoice.id,
    summary: `Invois baru: ${invoiceNo}`,
    metadata: { invoiceNo, customerId: data.customerId, totalCents: totals.totalCents },
  });

  return invoice;
}

/**
 * Create invoice from quotation
 */
export async function createInvoiceFromQuotation(
  quotationId: string,
  userId: string
): Promise<Invoice> {
  const quotation = await getQuotation(quotationId);

  if (quotation.status !== 'accepted') {
    throw new BusinessRuleError('Hanya sebutharga yang diterima boleh ditukar kepada invois');
  }

  // Check if invoice already exists for this quotation
  const existing = await db.invoices
    .where('quotationId')
    .equals(quotationId)
    .first();

  if (existing) {
    throw new BusinessRuleError('Invois untuk sebutharga ini sudah wujud');
  }

  const timestamp = now();
  const invoiceNo = await generateDocumentNumber('invoice');

  const invoice: Invoice = {
    id: generateId(),
    invoiceNo,
    quotationId,
    jobId: quotation.jobId,
    customerId: quotation.customerId,
    deviceId: quotation.deviceId,
    status: 'unpaid',
    lineItems: quotation.lineItems,
    subtotalCents: quotation.subtotalCents,
    discountCents: quotation.discountCents,
    taxCents: quotation.taxCents,
    totalCents: quotation.totalCents,
    amountPaidCents: 0,
    balanceCents: quotation.totalCents,
    createdByUserId: userId,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.invoices.add(invoice);

  await logAudit({
    actorUserId: userId,
    action: 'INVOICE_CREATED',
    entityType: 'Invoice',
    entityId: invoice.id,
    summary: `Invois ${invoiceNo} dicipta dari sebutharga ${quotation.quotationNo}`,
    metadata: { invoiceNo, quotationId, quotationNo: quotation.quotationNo },
  });

  return invoice;
}

/**
 * Update invoice payment status
 */
export async function updateInvoicePaymentStatus(
  id: string,
  amountPaidCents: number
): Promise<Invoice> {
  const invoice = await getInvoice(id);

  const balanceCents = invoice.totalCents - amountPaidCents;

  let status: InvoiceStatus;
  if (amountPaidCents === 0) {
    status = 'unpaid';
  } else if (balanceCents <= 0) {
    status = 'paid';
  } else {
    status = 'partially_paid';
  }

  const updated: Invoice = {
    ...invoice,
    amountPaidCents,
    balanceCents: Math.max(0, balanceCents),
    status,
    updatedAt: now(),
  };

  await db.invoices.put(updated);

  return updated;
}

/**
 * Cancel an invoice
 */
export async function cancelInvoice(
  id: string,
  reason: string,
  userId: string
): Promise<Invoice> {
  const invoice = await getInvoice(id);

  if (invoice.status === 'paid') {
    throw new BusinessRuleError('Invois yang sudah dibayar tidak boleh dibatalkan');
  }

  if (invoice.status === 'cancelled') {
    throw new BusinessRuleError('Invois sudah dibatalkan');
  }

  const timestamp = now();
  const updated: Invoice = {
    ...invoice,
    status: 'cancelled',
    cancelledAt: timestamp,
    cancelReason: reason,
    updatedAt: timestamp,
  };

  await db.invoices.put(updated);

  await logAudit({
    actorUserId: userId,
    action: 'INVOICE_CANCELLED',
    entityType: 'Invoice',
    entityId: id,
    summary: `Invois ${invoice.invoiceNo} dibatalkan: ${reason}`,
    metadata: { reason },
  });

  return updated;
}

/**
 * Search invoices
 */
export async function searchInvoices(query: string): Promise<Invoice[]> {
  const upperQuery = query.toUpperCase();
  return db.invoices
    .filter((i) => !i.deletedAt && i.invoiceNo.includes(upperQuery))
    .toArray();
}
