import Dexie, { type Table } from 'dexie';
import type {
  User,
  Customer,
  Device,
  Job,
  Quotation,
  Invoice,
  Receipt,
  Payment,
  Product,
  StockMovement,
  Settings,
  AuditEvent,
} from './types';

export class AppDatabase extends Dexie {
  users!: Table<User, string>;
  customers!: Table<Customer, string>;
  devices!: Table<Device, string>;
  jobs!: Table<Job, string>;
  quotations!: Table<Quotation, string>;
  invoices!: Table<Invoice, string>;
  receipts!: Table<Receipt, string>;
  payments!: Table<Payment, string>;
  products!: Table<Product, string>;
  stockMovements!: Table<StockMovement, string>;
  settings!: Table<Settings, string>;
  auditEvents!: Table<AuditEvent, string>;

  constructor() {
    super('kedaiservis-db');

    this.version(1).stores({
      users: 'id, username, role, isActive',
      customers: 'id, name, phone, deletedAt',
      devices: 'id, customerId, type, serialNumber, deletedAt',
      jobs: 'id, jobNo, customerId, deviceId, status, assignedUserId, createdAt, closedAt, deletedAt',
      quotations: 'id, quotationNo, jobId, customerId, status, createdAt, deletedAt',
      invoices: 'id, invoiceNo, quotationId, jobId, customerId, status, createdAt, deletedAt',
      receipts: 'id, receiptNo, invoiceId, createdAt',
      payments: 'id, invoiceId, method, receivedAt',
      products: 'id, name, sku, isActive',
      stockMovements: 'id, productId, type, createdAt',
      settings: 'id',
      auditEvents: 'id, actorUserId, action, entityType, entityId, createdAt',
    });
  }
}

export const db = new AppDatabase();

// Helper to generate UUID
export function generateId(): string {
  return crypto.randomUUID();
}

// Helper to get current timestamp
export function now(): string {
  return new Date().toISOString();
}
