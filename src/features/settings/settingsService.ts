import { db, now } from '@/services/storage/db';
import type { Settings, CompanyProfile, PrintSettings } from '@/services/storage/types';
import { currentYear } from '@/lib/time';

const SETTINGS_ID = 'SETTINGS';

/**
 * Get current settings
 */
export async function getSettings(): Promise<Settings> {
  let settings = await db.settings.get(SETTINGS_ID);

  if (!settings) {
    settings = createDefaultSettings();
    await db.settings.add(settings);
  }

  return settings;
}

/**
 * Create default settings object
 */
function createDefaultSettings(): Settings {
  return {
    id: SETTINGS_ID,
    companyProfile: {
      name: 'Kedai Servis Komputer',
      address: '',
      phone: '',
    },
    documentNumbering: {
      year: currentYear(),
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
}

/**
 * Update company profile
 */
export async function updateCompanyProfile(profile: CompanyProfile): Promise<Settings> {
  const settings = await getSettings();
  settings.companyProfile = profile;
  settings.updatedAt = now();
  await db.settings.put(settings);
  return settings;
}

/**
 * Update print settings
 */
export async function updatePrintSettings(printSettings: PrintSettings): Promise<Settings> {
  const settings = await getSettings();
  settings.printSettings = printSettings;
  settings.updatedAt = now();
  await db.settings.put(settings);
  return settings;
}

/**
 * Get company profile
 */
export async function getCompanyProfile(): Promise<CompanyProfile> {
  const settings = await getSettings();
  return settings.companyProfile;
}

/**
 * Get print settings
 */
export async function getPrintSettings(): Promise<PrintSettings> {
  const settings = await getSettings();
  return settings.printSettings;
}

/**
 * Update logo (data URL)
 */
export async function updateLogo(logoDataUrl: string): Promise<void> {
  const settings = await getSettings();
  settings.companyProfile.logoDataUrl = logoDataUrl;
  settings.updatedAt = now();
  await db.settings.put(settings);
}

/**
 * Remove logo
 */
export async function removeLogo(): Promise<void> {
  const settings = await getSettings();
  delete settings.companyProfile.logoDataUrl;
  settings.updatedAt = now();
  await db.settings.put(settings);
}
