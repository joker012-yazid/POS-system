import { db, generateId, now } from '@/services/storage/db';
import type { Device } from '@/services/storage/types';
import type { DeviceCreate } from '@/services/storage/schemas';
import { NotFoundError } from '@/lib/errors';
import { logAudit } from '@/services/audit/auditService';

/**
 * Get all active devices
 */
export async function getDevices(): Promise<Device[]> {
  return db.devices.filter((d) => !d.deletedAt).toArray();
}

/**
 * Get devices by customer ID
 */
export async function getDevicesByCustomer(customerId: string): Promise<Device[]> {
  return db.devices
    .where('customerId')
    .equals(customerId)
    .filter((d) => !d.deletedAt)
    .toArray();
}

/**
 * Get device by ID
 */
export async function getDevice(id: string): Promise<Device> {
  const device = await db.devices.get(id);
  if (!device || device.deletedAt) {
    throw new NotFoundError('Peranti', id);
  }
  return device;
}

/**
 * Create a new device
 */
export async function createDevice(
  data: DeviceCreate,
  userId: string
): Promise<Device> {
  const timestamp = now();

  const device: Device = {
    id: generateId(),
    customerId: data.customerId,
    type: data.type,
    brand: data.brand,
    model: data.model,
    serialNumber: data.serialNumber?.toUpperCase(),
    accessoriesReceived: data.accessoriesReceived,
    complaint: data.complaint,
    passwordNote: data.passwordNote,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.devices.add(device);

  await logAudit({
    actorUserId: userId,
    action: 'DEVICE_CREATED',
    entityType: 'Device',
    entityId: device.id,
    summary: `Peranti baru: ${device.type} ${device.brand || ''} ${device.model || ''}`.trim(),
  });

  return device;
}

/**
 * Update a device
 */
export async function updateDevice(
  id: string,
  data: Partial<DeviceCreate>,
  userId: string
): Promise<Device> {
  const device = await getDevice(id);

  const updated: Device = {
    ...device,
    ...data,
    serialNumber: data.serialNumber?.toUpperCase() ?? device.serialNumber,
    updatedAt: now(),
  };

  await db.devices.put(updated);

  await logAudit({
    actorUserId: userId,
    action: 'DEVICE_UPDATED',
    entityType: 'Device',
    entityId: id,
    summary: `Peranti dikemaskini: ${updated.type}`,
  });

  return updated;
}

/**
 * Soft delete a device
 */
export async function deleteDevice(id: string, userId: string): Promise<void> {
  const device = await getDevice(id);

  await db.devices.update(id, {
    deletedAt: now(),
    updatedAt: now(),
  });

  await logAudit({
    actorUserId: userId,
    action: 'DEVICE_DELETED',
    entityType: 'Device',
    entityId: id,
    summary: `Peranti dipadam: ${device.type}`,
  });
}

/**
 * Search devices by type, brand, model, or serial number
 */
export async function searchDevices(query: string): Promise<Device[]> {
  const lowerQuery = query.toLowerCase();
  return db.devices
    .filter((d) => !d.deletedAt && (
      d.type.toLowerCase().includes(lowerQuery) ||
      d.brand?.toLowerCase().includes(lowerQuery) ||
      d.model?.toLowerCase().includes(lowerQuery) ||
      d.serialNumber?.toLowerCase().includes(lowerQuery)
    ))
    .toArray();
}
