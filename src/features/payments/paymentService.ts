import { db, generateId, now } from '@/services/storage/db';
import type { Payment, PaymentMethod } from '@/services/storage/types';
import type { PaymentCreate } from '@/services/storage/schemas';
import { NotFoundError, BusinessRuleError } from '@/lib/errors';
import { logAudit } from '@/services/audit/auditService';
import { getInvoice, updateInvoicePaymentStatus } from '@/features/documents/invoices/invoiceService';
import { formatMoney, validatePaymentAmount } from '@/lib/money';

const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Tunai',
  online: 'Online',
};

export function getMethodLabel(method: PaymentMethod): string {
  return METHOD_LABELS[method];
}

/**
 * Get all payments for an invoice
 */
export async function getPaymentsForInvoice(invoiceId: string): Promise<Payment[]> {
  return db.payments
    .where('invoiceId')
    .equals(invoiceId)
    .toArray();
}

/**
 * Get payment by ID
 */
export async function getPayment(id: string): Promise<Payment> {
  const payment = await db.payments.get(id);
  if (!payment) {
    throw new NotFoundError('Pembayaran', id);
  }
  return payment;
}

/**
 * Record a payment
 */
export async function recordPayment(
  data: PaymentCreate,
  userId: string
): Promise<Payment> {
  const invoice = await getInvoice(data.invoiceId);

  // Validate invoice status
  if (invoice.status === 'cancelled') {
    throw new BusinessRuleError('Tidak boleh menerima bayaran untuk invois yang dibatalkan');
  }

  if (invoice.status === 'paid') {
    throw new BusinessRuleError('Invois ini sudah dibayar sepenuhnya');
  }

  // Validate payment amount
  const validation = validatePaymentAmount(data.amountCents, invoice.balanceCents);
  if (!validation.valid) {
    throw new BusinessRuleError(validation.error!);
  }

  // Validate online payment has reference
  if (data.method === 'online' && !data.reference) {
    throw new BusinessRuleError('Nombor rujukan diperlukan untuk pembayaran online');
  }

  const timestamp = now();

  const payment: Payment = {
    id: generateId(),
    invoiceId: data.invoiceId,
    method: data.method,
    amountCents: data.amountCents,
    reference: data.reference,
    provider: data.provider,
    receivedAt: timestamp,
    receivedByUserId: userId,
    note: data.note,
  };

  await db.payments.add(payment);

  // Update invoice payment status
  const newTotalPaid = invoice.amountPaidCents + data.amountCents;
  await updateInvoicePaymentStatus(invoice.id, newTotalPaid);

  await logAudit({
    actorUserId: userId,
    action: 'PAYMENT_RECORDED',
    entityType: 'Payment',
    entityId: payment.id,
    summary: `Pembayaran ${formatMoney(data.amountCents)} diterima untuk invois ${invoice.invoiceNo}`,
    metadata: {
      invoiceId: invoice.id,
      invoiceNo: invoice.invoiceNo,
      method: data.method,
      amountCents: data.amountCents,
    },
  });

  return payment;
}

/**
 * Get total payments for an invoice
 */
export async function getTotalPayments(invoiceId: string): Promise<number> {
  const payments = await getPaymentsForInvoice(invoiceId);
  return payments.reduce((sum, p) => sum + p.amountCents, 0);
}

/**
 * Get recent payments
 */
export async function getRecentPayments(limit: number = 10): Promise<Payment[]> {
  return db.payments
    .orderBy('receivedAt')
    .reverse()
    .limit(limit)
    .toArray();
}

/**
 * Get payments by date range
 */
export async function getPaymentsByDateRange(
  startDate: Date,
  endDate: Date
): Promise<Payment[]> {
  const startIso = startDate.toISOString();
  const endIso = endDate.toISOString();

  return db.payments
    .filter((p) => p.receivedAt >= startIso && p.receivedAt <= endIso)
    .toArray();
}

/**
 * Get total sales for a date range
 */
export async function getTotalSales(startDate: Date, endDate: Date): Promise<number> {
  const payments = await getPaymentsByDateRange(startDate, endDate);
  return payments.reduce((sum, p) => sum + p.amountCents, 0);
}
