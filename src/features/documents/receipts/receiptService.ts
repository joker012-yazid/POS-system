import { db, generateId, now } from '@/services/storage/db';
import type { Receipt, Invoice, Payment } from '@/services/storage/types';
import { NotFoundError } from '@/lib/errors';
import { logAudit } from '@/services/audit/auditService';
import { generateDocumentNumber } from '@/services/documents/numberingService';
import { getInvoice } from '@/features/documents/invoices/invoiceService';
import { getPaymentsForInvoice } from '@/features/payments/paymentService';

/**
 * Get receipt by ID
 */
export async function getReceipt(id: string): Promise<Receipt> {
  const receipt = await db.receipts.get(id);
  if (!receipt) {
    throw new NotFoundError('Resit', id);
  }
  return receipt;
}

/**
 * Get receipt by invoice ID
 */
export async function getReceiptByInvoice(invoiceId: string): Promise<Receipt | null> {
  return db.receipts.where('invoiceId').equals(invoiceId).first() || null;
}

/**
 * Get receipt by receipt number
 */
export async function getReceiptByNumber(receiptNo: string): Promise<Receipt | null> {
  return db.receipts.where('receiptNo').equals(receiptNo).first() || null;
}

/**
 * Generate a receipt for a fully paid invoice
 */
export async function generateReceipt(
  invoiceId: string,
  userId: string
): Promise<Receipt> {
  const invoice = await getInvoice(invoiceId);

  if (invoice.status !== 'paid') {
    throw new Error('Resit hanya boleh dijana untuk invois yang sudah dibayar sepenuhnya');
  }

  // Check if receipt already exists
  const existingReceipt = await getReceiptByInvoice(invoiceId);
  if (existingReceipt) {
    return existingReceipt;
  }

  const payments = await getPaymentsForInvoice(invoiceId);
  const receiptNo = await generateDocumentNumber('receipt');
  const timestamp = now();

  const receipt: Receipt = {
    id: generateId(),
    receiptNo,
    invoiceId,
    paidAt: timestamp,
    paymentIds: payments.map((p) => p.id),
    totalPaidCents: payments.reduce((sum, p) => sum + p.amountCents, 0),
    createdByUserId: userId,
    createdAt: timestamp,
  };

  await db.receipts.add(receipt);

  await logAudit({
    actorUserId: userId,
    action: 'RECEIPT_GENERATED',
    entityType: 'Receipt',
    entityId: receipt.id,
    summary: `Resit ${receiptNo} dijana untuk invois ${invoice.invoiceNo}`,
    metadata: {
      receiptNo,
      invoiceId,
      invoiceNo: invoice.invoiceNo,
      totalPaidCents: receipt.totalPaidCents,
    },
  });

  return receipt;
}

/**
 * Get all receipts
 */
export async function getReceipts(): Promise<Receipt[]> {
  return db.receipts.orderBy('createdAt').reverse().toArray();
}

/**
 * Get receipt with invoice and payments
 */
export async function getReceiptWithDetails(id: string): Promise<{
  receipt: Receipt;
  invoice: Invoice;
  payments: Payment[];
}> {
  const receipt = await getReceipt(id);
  const invoice = await getInvoice(receipt.invoiceId);
  const payments = await getPaymentsForInvoice(receipt.invoiceId);

  return { receipt, invoice, payments };
}

/**
 * Search receipts by receipt number
 */
export async function searchReceipts(query: string): Promise<Receipt[]> {
  const upperQuery = query.toUpperCase();
  return db.receipts
    .filter((r) => r.receiptNo.includes(upperQuery))
    .toArray();
}
