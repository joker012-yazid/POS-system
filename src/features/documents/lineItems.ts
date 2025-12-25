import { generateId } from '@/services/storage/db';
import type { LineItem, LineItemType } from '@/services/storage/types';
import type { LineItemInput } from '@/services/storage/schemas';
import { calculateLineTotal, calculateTotals } from '@/lib/money';

/**
 * Create a line item from input data
 */
export function createLineItem(input: LineItemInput): LineItem {
  const lineTotalCents = calculateLineTotal(input.quantity, input.unitPriceCents);

  return {
    id: generateId(),
    type: input.type,
    description: input.description,
    quantity: input.quantity,
    unitPriceCents: input.unitPriceCents,
    lineTotalCents,
    productId: input.productId,
  };
}

/**
 * Create multiple line items from input array
 */
export function createLineItems(inputs: LineItemInput[]): LineItem[] {
  return inputs.map(createLineItem);
}

/**
 * Calculate document totals from line items
 */
export function calculateDocumentTotals(
  lineItems: LineItem[],
  discountCents: number = 0,
  taxCents: number = 0
) {
  return calculateTotals(lineItems, discountCents, taxCents);
}

/**
 * Recalculate line item totals (after edit)
 */
export function recalculateLineItems(lineItems: LineItem[]): LineItem[] {
  return lineItems.map((item) => ({
    ...item,
    lineTotalCents: calculateLineTotal(item.quantity, item.unitPriceCents),
  }));
}

/**
 * Create an empty service line item
 */
export function createEmptyServiceItem(): LineItemInput {
  return {
    type: 'service',
    description: '',
    quantity: 1,
    unitPriceCents: 0,
  };
}

/**
 * Create a product line item
 */
export function createProductItem(
  productId: string,
  description: string,
  priceCents: number,
  quantity: number = 1
): LineItemInput {
  return {
    type: 'product',
    description,
    quantity,
    unitPriceCents: priceCents,
    productId,
  };
}

/**
 * Validate line items
 */
export function validateLineItems(
  lineItems: LineItemInput[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (lineItems.length === 0) {
    errors.push('Sekurang-kurangnya satu item diperlukan');
  }

  lineItems.forEach((item, idx) => {
    if (!item.description.trim()) {
      errors.push(`Item ${idx + 1}: Keterangan diperlukan`);
    }
    if (item.quantity <= 0) {
      errors.push(`Item ${idx + 1}: Kuantiti mesti lebih dari sifar`);
    }
    if (item.unitPriceCents < 0) {
      errors.push(`Item ${idx + 1}: Harga tidak boleh negatif`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get line item type label
 */
export function getLineItemTypeLabel(type: LineItemType): string {
  return type === 'service' ? 'Servis' : 'Produk';
}
