// Enumerations

export type Role = 'admin' | 'user';

export type JobStatus =
  | 'received'
  | 'diagnose'
  | 'quoted'
  | 'in_progress'
  | 'ready'
  | 'closed';

export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';

export type InvoiceStatus = 'unpaid' | 'partially_paid' | 'paid' | 'cancelled';

export type PaymentMethod = 'cash' | 'online';

export type StockMovementType = 'in' | 'out' | 'adjust' | 'sale' | 'return';

export type LineItemType = 'service' | 'product';

// Entities

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: Role;
  isActive: boolean;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Device {
  id: string;
  customerId: string;
  type: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  accessoriesReceived?: string;
  complaint?: string;
  passwordNote?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface JobStatusEvent {
  from?: JobStatus;
  to: JobStatus;
  changedAt: string;
  changedByUserId: string;
}

export interface JobTask {
  id: string;
  title: string;
  isDone: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: string;
  jobNo: string;
  customerId: string;
  deviceId: string;
  status: JobStatus;
  assignedUserId?: string;
  tasks: JobTask[];
  internalNote?: string;
  customerNote?: string;
  laborCents: number;
  partsCents: number;
  discountCents: number;
  taxCents: number;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  statusHistory: JobStatusEvent[];
  deletedAt?: string;
}

export interface LineItem {
  id: string;
  type: LineItemType;
  description: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  productId?: string;
}

export interface Quotation {
  id: string;
  quotationNo: string;
  jobId?: string;
  customerId: string;
  deviceId?: string;
  status: QuotationStatus;
  validUntil?: string;
  lineItems: LineItem[];
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  quotationId?: string;
  jobId?: string;
  customerId: string;
  deviceId?: string;
  status: InvoiceStatus;
  dueDate?: string;
  lineItems: LineItem[];
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  amountPaidCents: number;
  balanceCents: number;
  createdByUserId: string;
  cancelledAt?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Receipt {
  id: string;
  receiptNo: string;
  invoiceId: string;
  paidAt: string;
  paymentIds: string[];
  totalPaidCents: number;
  createdByUserId: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  method: PaymentMethod;
  amountCents: number;
  reference?: string;
  provider?: string;
  receivedAt: string;
  receivedByUserId: string;
  note?: string;
}

export interface Product {
  id: string;
  name: string;
  sku?: string;
  costCents: number;
  priceCents: number;
  stockQty: number;
  minStockQty: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  type: StockMovementType;
  deltaQty: number;
  reason?: string;
  invoiceId?: string;
  createdByUserId: string;
  createdAt: string;
}

export interface CompanyProfile {
  name: string;
  address?: string;
  phone?: string;
  logoDataUrl?: string;
}

export interface DocumentNumbering {
  year: number;
  jobCounter: number;
  quotationCounter: number;
  invoiceCounter: number;
  receiptCounter: number;
}

export interface PrintSettings {
  mode: 'a4' | 'thermal';
  thermalWidthMm?: number;
}

export interface Settings {
  id: string;
  companyProfile: CompanyProfile;
  documentNumbering: DocumentNumbering;
  printSettings: PrintSettings;
  updatedAt: string;
}

export interface AuditEvent {
  id: string;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// Backup format

export interface BackupData {
  users: User[];
  customers: Customer[];
  devices: Device[];
  jobs: Job[];
  quotations: Quotation[];
  invoices: Invoice[];
  receipts: Receipt[];
  payments: Payment[];
  products: Product[];
  stockMovements: StockMovement[];
  auditEvents: AuditEvent[];
  settings: Settings[];
}

export interface BackupEnvelope {
  schemaVersion: string;
  exportedAt: string;
  app: string;
  data: BackupData;
}

// Session
export interface SessionUser {
  id: string;
  username: string;
  name: string;
  role: Role;
}
