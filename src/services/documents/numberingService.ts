import { db, now } from '@/services/storage/db';
import { currentYear } from '@/lib/time';
import type { Settings } from '@/services/storage/types';

type DocumentType = 'job' | 'quotation' | 'invoice' | 'receipt';

const PREFIX_MAP: Record<DocumentType, string> = {
  job: 'JS',
  quotation: 'QT',
  invoice: 'INV',
  receipt: 'RC',
};

const COUNTER_KEY_MAP: Record<DocumentType, keyof Settings['documentNumbering']> = {
  job: 'jobCounter',
  quotation: 'quotationCounter',
  invoice: 'invoiceCounter',
  receipt: 'receiptCounter',
};

/**
 * Get or create settings with updated year
 */
async function getSettings(): Promise<Settings> {
  let settings = await db.settings.get('SETTINGS');

  if (!settings) {
    const year = currentYear();
    settings = {
      id: 'SETTINGS',
      companyProfile: {
        name: 'Kedai Servis Komputer',
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
      updatedAt: now(),
    };
    await db.settings.add(settings);
  }

  // Check if year has changed - reset counters
  const year = currentYear();
  if (settings.documentNumbering.year !== year) {
    settings.documentNumbering = {
      year,
      jobCounter: 0,
      quotationCounter: 0,
      invoiceCounter: 0,
      receiptCounter: 0,
    };
    settings.updatedAt = now();
    await db.settings.put(settings);
  }

  return settings;
}

/**
 * Generate next document number
 * Format: PREFIX-YYYY-NNNNNN (e.g., JS-2025-000001)
 */
export async function generateDocumentNumber(type: DocumentType): Promise<string> {
  const settings = await getSettings();
  const prefix = PREFIX_MAP[type];
  const counterKey = COUNTER_KEY_MAP[type];
  const year = settings.documentNumbering.year;

  // Increment counter
  const newCounter = (settings.documentNumbering[counterKey] as number) + 1;
  settings.documentNumbering[counterKey] = newCounter;
  settings.updatedAt = now();

  await db.settings.put(settings);

  // Format: PREFIX-YYYY-NNNNNN
  const paddedNumber = newCounter.toString().padStart(6, '0');
  return `${prefix}-${year}-${paddedNumber}`;
}

/**
 * Get current counter value without incrementing
 */
export async function getCurrentCounter(type: DocumentType): Promise<number> {
  const settings = await getSettings();
  const counterKey = COUNTER_KEY_MAP[type];
  return settings.documentNumbering[counterKey] as number;
}

/**
 * Parse document number to extract year and sequence
 */
export function parseDocumentNumber(docNo: string): {
  prefix: string;
  year: number;
  sequence: number;
} | null {
  const match = docNo.match(/^([A-Z]+)-(\d{4})-(\d+)$/);
  if (!match) return null;

  return {
    prefix: match[1],
    year: parseInt(match[2], 10),
    sequence: parseInt(match[3], 10),
  };
}
