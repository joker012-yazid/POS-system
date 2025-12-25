/**
 * Money utilities - all monetary values stored as cents (integers)
 * to avoid floating point errors.
 */

const CURRENCY = 'MYR';
const LOCALE = 'ms-MY';

/**
 * Convert ringgit amount to cents
 */
export function toCents(ringgit: number): number {
  return Math.round(ringgit * 100);
}

/**
 * Convert cents to ringgit amount
 */
export function toRinggit(cents: number): number {
  return cents / 100;
}

/**
 * Format cents as currency string (e.g., "RM 123.45")
 */
export function formatMoney(cents: number): string {
  const amount = toRinggit(cents);
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: CURRENCY,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format cents as simple number string without currency symbol (e.g., "123.45")
 */
export function formatAmount(cents: number): string {
  const amount = toRinggit(cents);
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Parse money input string to cents
 * Handles both "123.45" and "12345" (as whole cents) formats
 */
export function parseMoney(input: string): number {
  // Remove currency symbols, spaces, and thousand separators
  const cleaned = input.replace(/[RM\s,]/gi, '').trim();

  if (!cleaned || isNaN(Number(cleaned))) {
    return 0;
  }

  const num = parseFloat(cleaned);
  return toCents(num);
}

/**
 * Calculate line item total
 */
export function calculateLineTotal(quantity: number, unitPriceCents: number): number {
  return Math.round(quantity * unitPriceCents);
}

/**
 * Calculate document totals from line items
 */
export function calculateTotals(
  lineItems: Array<{ quantity: number; unitPriceCents: number }>,
  discountCents: number = 0,
  taxCents: number = 0
): {
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
} {
  const subtotalCents = lineItems.reduce((sum, item) => {
    return sum + calculateLineTotal(item.quantity, item.unitPriceCents);
  }, 0);

  const totalCents = Math.max(0, subtotalCents - discountCents + taxCents);

  return {
    subtotalCents,
    discountCents,
    taxCents,
    totalCents,
  };
}

/**
 * Validate payment amount doesn't exceed balance
 */
export function validatePaymentAmount(
  amountCents: number,
  balanceCents: number
): { valid: boolean; error?: string } {
  if (amountCents <= 0) {
    return { valid: false, error: 'Jumlah bayaran mestilah lebih dari sifar' };
  }

  if (amountCents > balanceCents) {
    return {
      valid: false,
      error: `Jumlah bayaran (${formatMoney(amountCents)}) melebihi baki (${formatMoney(balanceCents)})`,
    };
  }

  return { valid: true };
}
