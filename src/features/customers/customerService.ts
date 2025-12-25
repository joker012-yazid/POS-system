import { db, generateId, now } from '@/services/storage/db';
import type { Customer } from '@/services/storage/types';
import type { CustomerCreate } from '@/services/storage/schemas';
import { NotFoundError } from '@/lib/errors';
import { logAudit } from '@/services/audit/auditService';

/**
 * Get all active customers
 */
export async function getCustomers(): Promise<Customer[]> {
  return db.customers
    .filter((c) => !c.deletedAt)
    .toArray();
}

/**
 * Search customers by name or phone
 */
export async function searchCustomers(query: string): Promise<Customer[]> {
  const lowerQuery = query.toLowerCase();
  return db.customers
    .filter((c) => !c.deletedAt && (
      c.name.toLowerCase().includes(lowerQuery) ||
      c.phone.includes(query)
    ))
    .toArray();
}

/**
 * Get customer by ID
 */
export async function getCustomer(id: string): Promise<Customer> {
  const customer = await db.customers.get(id);
  if (!customer || customer.deletedAt) {
    throw new NotFoundError('Pelanggan', id);
  }
  return customer;
}

/**
 * Create a new customer
 */
export async function createCustomer(
  data: CustomerCreate,
  userId: string
): Promise<Customer> {
  const timestamp = now();

  const customer: Customer = {
    id: generateId(),
    name: data.name,
    phone: data.phone,
    email: data.email,
    address: data.address,
    tags: data.tags,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.customers.add(customer);

  await logAudit({
    actorUserId: userId,
    action: 'CUSTOMER_CREATED',
    entityType: 'Customer',
    entityId: customer.id,
    summary: `Pelanggan baru: ${customer.name}`,
  });

  return customer;
}

/**
 * Update a customer
 */
export async function updateCustomer(
  id: string,
  data: Partial<CustomerCreate>,
  userId: string
): Promise<Customer> {
  const customer = await getCustomer(id);

  const updated: Customer = {
    ...customer,
    ...data,
    updatedAt: now(),
  };

  await db.customers.put(updated);

  await logAudit({
    actorUserId: userId,
    action: 'CUSTOMER_UPDATED',
    entityType: 'Customer',
    entityId: id,
    summary: `Pelanggan dikemaskini: ${updated.name}`,
  });

  return updated;
}

/**
 * Soft delete a customer
 */
export async function deleteCustomer(id: string, userId: string): Promise<void> {
  const customer = await getCustomer(id);

  await db.customers.update(id, {
    deletedAt: now(),
    updatedAt: now(),
  });

  await logAudit({
    actorUserId: userId,
    action: 'CUSTOMER_DELETED',
    entityType: 'Customer',
    entityId: id,
    summary: `Pelanggan dipadam: ${customer.name}`,
  });
}

/**
 * Get customer with their devices
 */
export async function getCustomerWithDevices(id: string) {
  const customer = await getCustomer(id);
  const devices = await db.devices
    .where('customerId')
    .equals(id)
    .filter((d) => !d.deletedAt)
    .toArray();

  return { customer, devices };
}
