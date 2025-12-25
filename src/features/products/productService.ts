import { db, generateId, now } from '@/services/storage/db';
import type { Product } from '@/services/storage/types';
import type { ProductCreate } from '@/services/storage/schemas';
import { NotFoundError } from '@/lib/errors';
import { logAudit } from '@/services/audit/auditService';

/**
 * Get all active products
 */
export async function getProducts(): Promise<Product[]> {
  return db.products.toArray();
}

/**
 * Get active products only
 */
export async function getActiveProducts(): Promise<Product[]> {
  return db.products.where('isActive').equals(1).toArray();
}

/**
 * Get product by ID
 */
export async function getProduct(id: string): Promise<Product> {
  const product = await db.products.get(id);
  if (!product) throw new NotFoundError('Produk', id);
  return product;
}

/**
 * Search products by name or SKU
 */
export async function searchProducts(query: string): Promise<Product[]> {
  const lowerQuery = query.toLowerCase();
  return db.products
    .filter((p) =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.sku?.toLowerCase().includes(lowerQuery)
    )
    .toArray();
}

/**
 * Create a new product
 */
export async function createProduct(
  data: ProductCreate,
  userId: string
): Promise<Product> {
  const timestamp = now();

  const product: Product = {
    id: generateId(),
    name: data.name,
    sku: data.sku?.toUpperCase(),
    costCents: data.costCents,
    priceCents: data.priceCents,
    stockQty: data.stockQty || 0,
    minStockQty: data.minStockQty || 0,
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.products.add(product);

  await logAudit({
    actorUserId: userId,
    action: 'PRODUCT_CREATED',
    entityType: 'Product',
    entityId: product.id,
    summary: `Produk baru: ${product.name}`,
  });

  return product;
}

/**
 * Update a product
 */
export async function updateProduct(
  id: string,
  data: Partial<ProductCreate>,
  userId: string
): Promise<Product> {
  const product = await getProduct(id);

  const updated: Product = {
    ...product,
    ...data,
    sku: data.sku?.toUpperCase() ?? product.sku,
    updatedAt: now(),
  };

  await db.products.put(updated);

  await logAudit({
    actorUserId: userId,
    action: 'PRODUCT_UPDATED',
    entityType: 'Product',
    entityId: id,
    summary: `Produk dikemaskini: ${updated.name}`,
  });

  return updated;
}

/**
 * Toggle product active status
 */
export async function toggleProductActive(id: string, userId: string): Promise<Product> {
  const product = await getProduct(id);

  const updated: Product = {
    ...product,
    isActive: !product.isActive,
    updatedAt: now(),
  };

  await db.products.put(updated);

  return updated;
}

/**
 * Get low stock products
 */
export async function getLowStockProducts(): Promise<Product[]> {
  return db.products
    .filter((p) => p.isActive && p.stockQty <= p.minStockQty)
    .toArray();
}

/**
 * Get low stock count
 */
export async function getLowStockCount(): Promise<number> {
  const products = await getLowStockProducts();
  return products.length;
}

/**
 * Update stock quantity directly
 */
export async function updateStockQty(id: string, newQty: number): Promise<void> {
  await db.products.update(id, {
    stockQty: newQty,
    updatedAt: now(),
  });
}
