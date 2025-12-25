import { getCompanyProfile } from '@/features/settings/settingsService';
import type { CompanyProfile } from '@/services/storage/types';

/**
 * Open print dialog for the current page
 */
export function openPrintDialog(): void {
  window.print();
}

/**
 * Get company profile for printing
 */
export async function getCompanyProfileForPrint(): Promise<CompanyProfile> {
  return getCompanyProfile();
}

/**
 * Print-specific CSS class utilities
 */
export const printClasses = {
  noPrint: 'no-print',
  printOnly: 'print-only',
  pageBreakBefore: 'print:break-before-page',
  pageBreakAfter: 'print:break-after-page',
  avoidBreak: 'print:break-inside-avoid',
};

/**
 * A4 page dimensions in CSS
 */
export const a4Dimensions = {
  width: '210mm',
  minHeight: '297mm',
  padding: '15mm',
};

/**
 * Thermal receipt dimensions
 */
export const thermalDimensions = {
  width58mm: '58mm',
  width80mm: '80mm',
  padding: '2mm',
};

/**
 * Format document for printing
 */
export function formatForPrint(content: string): string {
  return content
    .replace(/\n/g, '<br />')
    .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
}
