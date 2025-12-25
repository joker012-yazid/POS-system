import { db, generateId, now } from '@/services/storage/db';
import type { StockMovement, StockMovementType } from '@/services/storage/types';
import { logAudit } from '@/services/audit/auditService';
import { getProduct, updateStockQty } from './productService';

/**
 * Get stock movements for a product
 */
export async function getStockMovements(productId: string): Promise<StockMovement[]> {
  return db.stockMovements
    .where('productId')
    .equals(productId)
    .reverse()
    .toArray();
}

/**
 * Get all stock movements (for report)
 */
export async function getAllStockMovements(limit: number = 100): Promise<StockMovement[]> {
  return db.stockMovements
    .orderBy('createdAt')
    .reverse()
    .limit(limit)
    .toArray();
}

/**
 * Create a stock movement and update product stock
 */
export async function createStockMovement(
  productId: string,
  type: StockMovementType,
  deltaQty: number,
  reason: string | undefined,
  userId: string,
  invoiceId?: string
): Promise<StockMovement> {
  const product = await getProduct(productId);
  const timestamp = now();

  // Calculate new stock
  let actualDelta = deltaQty;
  if (type === 'out' || type === 'sale') {
    actualDelta = -Math.abs(deltaQty);
  } else if (type === 'in' || type === 'return') {
    actualDelta = Math.abs(deltaQty);
  }
  // For 'adjust', keep the sign as provided

  const newStockQty = Math.max(0, product.stockQty + actualDelta);

  const movement: StockMovement = {
    id: generateId(),
    productId,
    type,
    deltaQty: actualDelta,
    reason,
    invoiceId,
    createdByUserId: userId,
    createdAt: timestamp,
  };

  await db.stockMovements.add(movement);
  await updateStockQty(productId, newStockQty);

  if (type === 'adjust') {
    await logAudit({
      actorUserId: userId,
      action: 'STOCK_ADJUSTED',
      entityType: 'Product',
      entityId: productId,
      summary: `Stok ${product.name} diselaraskan: ${actualDelta > 0 ? '+' : ''}${actualDelta}. Sebab: ${reason}`,
      metadata: { type, deltaQty: actualDelta, reason, newStockQty },
    });
  }

  return movement;
}

/**
 * Adjust stock (for manual adjustments)
 */
export async function adjustStock(
  productId: string,
  adjustType: 'in' | 'out' | 'adjust',
  quantity: number,
  reason: string,
  userId: string
): Promise<StockMovement> {
  return createStockMovement(productId, adjustType, quantity, reason, userId);
}

/**
 * Decrement stock for sale (called when invoice is paid)
 */
export async function decrementStockForSale(
  productId: string,
  quantity: number,
  userId: string,
  invoiceId: string
): Promise<StockMovement> {
  return createStockMovement(productId, 'sale', quantity, undefined, userId, invoiceId);
}

/**
 * Get stock movement type label
 */
export function getMovementTypeLabel(type: StockMovementType): string {
  const labels: Record<StockMovementType, string> = {
    in: 'Masuk',
    out: 'Keluar',
    adjust: 'Pelarasan',
    sale: 'Jualan',
    return: 'Pulangan',
  };
  return labels[type];
}
