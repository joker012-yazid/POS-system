import { backupEnvelopeSchema } from '@/services/storage/schemas';
import type { BackupEnvelope, BackupData } from '@/services/storage/types';

export const SCHEMA_VERSION = '1.0.0';
export const APP_IDENTIFIER = 'pos-servis-static';

/**
 * Validate a backup envelope
 */
export function validateBackup(data: unknown): { valid: boolean; errors: string[] } {
  try {
    backupEnvelopeSchema.parse(data);
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof Error && 'errors' in error) {
      const zodError = error as { errors: Array<{ message: string; path: (string | number)[] }> };
      return {
        valid: false,
        errors: zodError.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
      };
    }
    return { valid: false, errors: ['Format backup tidak sah'] };
  }
}

/**
 * Create a backup envelope
 */
export function createBackupEnvelope(data: BackupData): BackupEnvelope {
  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    app: APP_IDENTIFIER,
    data,
  };
}

/**
 * Check if a backup version is compatible
 */
export function isCompatibleVersion(version: string): boolean {
  const [major] = version.split('.').map(Number);
  const [currentMajor] = SCHEMA_VERSION.split('.').map(Number);
  return major === currentMajor;
}
