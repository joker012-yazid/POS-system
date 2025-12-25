import { db } from '@/services/storage/db';
import type { BackupEnvelope } from '@/services/storage/types';
import { validateBackup, isCompatibleVersion } from './backupSchema';
import { clearForImport } from '@/services/storage/clearAll';
import { logAudit } from '@/services/audit/auditService';

interface ImportResult {
  success: boolean;
  error?: string;
  recordCounts?: Record<string, number>;
}

/**
 * Import data from a backup file
 */
export async function importData(
  backup: BackupEnvelope,
  userId: string
): Promise<ImportResult> {
  // Validate structure
  const validation = validateBackup(backup);
  if (!validation.valid) {
    return {
      success: false,
      error: `Format backup tidak sah: ${validation.errors.join(', ')}`,
    };
  }

  // Check version compatibility
  if (!isCompatibleVersion(backup.schemaVersion)) {
    return {
      success: false,
      error: `Versi backup (${backup.schemaVersion}) tidak serasi`,
    };
  }

  // Check for duplicate document numbers
  const duplicates = await checkForDuplicates(backup);
  if (duplicates.length > 0) {
    return {
      success: false,
      error: `Dokumen berikut sudah wujud: ${duplicates.join(', ')}`,
    };
  }

  try {
    // Clear existing data
    await clearForImport();

    // Import all data in a transaction
    await db.transaction('rw', db.tables, async () => {
      const { data } = backup;

      if (data.users.length > 0) await db.users.bulkAdd(data.users);
      if (data.customers.length > 0) await db.customers.bulkAdd(data.customers);
      if (data.devices.length > 0) await db.devices.bulkAdd(data.devices);
      if (data.jobs.length > 0) await db.jobs.bulkAdd(data.jobs);
      if (data.quotations.length > 0) await db.quotations.bulkAdd(data.quotations);
      if (data.invoices.length > 0) await db.invoices.bulkAdd(data.invoices);
      if (data.receipts.length > 0) await db.receipts.bulkAdd(data.receipts);
      if (data.payments.length > 0) await db.payments.bulkAdd(data.payments);
      if (data.products.length > 0) await db.products.bulkAdd(data.products);
      if (data.stockMovements.length > 0) await db.stockMovements.bulkAdd(data.stockMovements);
      if (data.auditEvents.length > 0) await db.auditEvents.bulkAdd(data.auditEvents);
      if (data.settings.length > 0) await db.settings.bulkAdd(data.settings);
    });

    const recordCounts = {
      users: backup.data.users.length,
      customers: backup.data.customers.length,
      devices: backup.data.devices.length,
      jobs: backup.data.jobs.length,
      quotations: backup.data.quotations.length,
      invoices: backup.data.invoices.length,
      receipts: backup.data.receipts.length,
      payments: backup.data.payments.length,
      products: backup.data.products.length,
      stockMovements: backup.data.stockMovements.length,
    };

    await logAudit({
      actorUserId: userId,
      action: 'DATA_IMPORTED',
      entityType: 'System',
      entityId: 'backup',
      summary: 'Data diimport dari backup',
      metadata: { recordCounts, exportedAt: backup.exportedAt },
    });

    return { success: true, recordCounts };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ralat tidak dijangka semasa import',
    };
  }
}

/**
 * Check for duplicate document numbers
 */
async function checkForDuplicates(backup: BackupEnvelope): Promise<string[]> {
  const duplicates: string[] = [];

  for (const job of backup.data.jobs) {
    const existing = await db.jobs.where('jobNo').equals(job.jobNo).first();
    if (existing) duplicates.push(job.jobNo);
  }

  for (const quotation of backup.data.quotations) {
    const existing = await db.quotations.where('quotationNo').equals(quotation.quotationNo).first();
    if (existing) duplicates.push(quotation.quotationNo);
  }

  for (const invoice of backup.data.invoices) {
    const existing = await db.invoices.where('invoiceNo').equals(invoice.invoiceNo).first();
    if (existing) duplicates.push(invoice.invoiceNo);
  }

  for (const receipt of backup.data.receipts) {
    const existing = await db.receipts.where('receiptNo').equals(receipt.receiptNo).first();
    if (existing) duplicates.push(receipt.receiptNo);
  }

  return duplicates;
}

/**
 * Read and parse a backup file
 */
export async function readBackupFile(file: File): Promise<BackupEnvelope> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const content = reader.result as string;
        const data = JSON.parse(content);
        resolve(data as BackupEnvelope);
      } catch {
        reject(new Error('Fail bukan format JSON yang sah'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca fail'));
    reader.readAsText(file);
  });
}
