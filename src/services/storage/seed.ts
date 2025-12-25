import { db, generateId, now } from './db';
import { hashPassword } from '@/features/auth/password';
import type { Settings } from './types';
import { currentYear } from '@/lib/time';

/**
 * Seed default admin user if no users exist
 */
export async function seedDefaultAdmin(): Promise<void> {
  const count = await db.users.count();
  if (count > 0) return;

  const timestamp = now();
  const { hash, salt } = await hashPassword('admin123');

  await db.users.add({
    id: generateId(),
    username: 'admin',
    displayName: 'Administrator',
    role: 'admin',
    isActive: true,
    passwordHash: hash,
    passwordSalt: salt,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  console.log('[Seed] Default admin user created (username: admin, password: admin123)');
}

/**
 * Seed default settings if none exist
 */
export async function seedDefaultSettings(): Promise<void> {
  const existing = await db.settings.get('SETTINGS');
  if (existing) return;

  const timestamp = now();
  const year = currentYear();

  const defaultSettings: Settings = {
    id: 'SETTINGS',
    companyProfile: {
      name: 'Kedai Servis Komputer',
      address: '',
      phone: '',
    },
    documentNumbering: {
      year,
      jobCounter: 0,
      quotationCounter: 0,
      invoiceCounter: 0,
      receiptCounter: 0,
    },
    printSettings: {
      mode: 'a4',
    },
    updatedAt: timestamp,
  };

  await db.settings.add(defaultSettings);
  console.log('[Seed] Default settings created');
}

/**
 * Run all seed operations
 */
export async function seedDatabase(): Promise<void> {
  await seedDefaultAdmin();
  await seedDefaultSettings();
}
