import { db } from '@/services/storage/db';
import type { BackupData, BackupEnvelope } from '@/services/storage/types';
import { createBackupEnvelope } from './backupSchema';
import { logAudit } from '@/services/audit/auditService';

/**
 * Export all data to a backup file
 */
export async function exportData(userId: string): Promise<BackupEnvelope> {
  const data: BackupData = {
    users: await db.users.toArray(),
    customers: await db.customers.toArray(),
    devices: await db.devices.toArray(),
    jobs: await db.jobs.toArray(),
    quotations: await db.quotations.toArray(),
    invoices: await db.invoices.toArray(),
    receipts: await db.receipts.toArray(),
    payments: await db.payments.toArray(),
    products: await db.products.toArray(),
    stockMovements: await db.stockMovements.toArray(),
    auditEvents: await db.auditEvents.toArray(),
    settings: await db.settings.toArray(),
  };

  const envelope = createBackupEnvelope(data);

  await logAudit({
    actorUserId: userId,
    action: 'DATA_EXPORTED',
    entityType: 'System',
    entityId: 'backup',
    summary: 'Data dieksport',
    metadata: {
      schemaVersion: envelope.schemaVersion,
      recordCounts: {
        users: data.users.length,
        customers: data.customers.length,
        devices: data.devices.length,
        jobs: data.jobs.length,
        quotations: data.quotations.length,
        invoices: data.invoices.length,
        receipts: data.receipts.length,
        payments: data.payments.length,
        products: data.products.length,
        stockMovements: data.stockMovements.length,
      },
    },
  });

  return envelope;
}

/**
 * Download backup as JSON file
 */
export async function downloadBackup(userId: string): Promise<void> {
  const backup = await exportData(userId);
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const date = new Date().toISOString().split('T')[0];
  const filename = `kedaiservis-backup-${date}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
