import { db } from './db';
import { seedDatabase } from './seed';

/**
 * Clear all data from the database
 * WARNING: This is destructive and cannot be undone
 */
export async function clearAllData(): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    // Clear all tables
    await db.users.clear();
    await db.customers.clear();
    await db.devices.clear();
    await db.jobs.clear();
    await db.quotations.clear();
    await db.invoices.clear();
    await db.receipts.clear();
    await db.payments.clear();
    await db.products.clear();
    await db.stockMovements.clear();
    await db.settings.clear();
    await db.auditEvents.clear();
  });

  console.log('[ClearAll] All data cleared');

  // Re-seed default data
  await seedDatabase();
  console.log('[ClearAll] Default data re-seeded');
}

/**
 * Clear data for import (keeps structure but removes all records)
 */
export async function clearForImport(): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    await db.users.clear();
    await db.customers.clear();
    await db.devices.clear();
    await db.jobs.clear();
    await db.quotations.clear();
    await db.invoices.clear();
    await db.receipts.clear();
    await db.payments.clear();
    await db.products.clear();
    await db.stockMovements.clear();
    await db.settings.clear();
    await db.auditEvents.clear();
  });

  console.log('[ClearForImport] All data cleared for import');
}
