import { z } from 'zod';

// Enums
export const roleSchema = z.enum(['admin', 'user']);
export const jobStatusSchema = z.enum(['received', 'diagnose', 'quoted', 'in_progress', 'ready', 'closed']);
export const quotationStatusSchema = z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired']);
export const invoiceStatusSchema = z.enum(['unpaid', 'partially_paid', 'paid', 'cancelled']);
export const paymentMethodSchema = z.enum(['cash', 'online']);
export const stockMovementTypeSchema = z.enum(['in', 'out', 'adjust', 'sale', 'return']);
export const lineItemTypeSchema = z.enum(['service', 'product']);

// Common patterns
const uuidPattern = z.string().uuid();
const timestampPattern = z.string().datetime();
const datePattern = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const phonePattern = z.string().min(1).max(20);
const emailPattern = z.string().email().optional();

// User schemas
export const userSchema = z.object({
  id: uuidPattern,
  username: z.string().min(3).max(50),
  displayName: z.string().min(1).max(100),
  role: roleSchema,
  isActive: z.boolean(),
  passwordHash: z.string(),
  passwordSalt: z.string(),
  createdAt: timestampPattern,
  updatedAt: timestampPattern,
  lastLoginAt: timestampPattern.optional(),
});

export const userCreateSchema = z.object({
  username: z.string().min(3).max(50).transform((val) => val.toLowerCase().trim()),
  displayName: z.string().min(1).max(100),
  role: roleSchema,
  password: z.string().min(4).max(100),
});

// Customer schemas
export const customerSchema = z.object({
  id: uuidPattern,
  name: z.string().min(1).max(200),
  phone: phonePattern,
  email: emailPattern,
  address: z.string().max(500).optional(),
  tags: z.array(z.string()).optional(),
  createdAt: timestampPattern,
  updatedAt: timestampPattern,
  deletedAt: timestampPattern.optional(),
});

export const customerCreateSchema = z.object({
  name: z.string().min(1).max(200),
  phone: phonePattern,
  email: emailPattern,
  address: z.string().max(500).optional(),
  tags: z.array(z.string()).optional(),
});

// Device schemas
export const deviceSchema = z.object({
  id: uuidPattern,
  customerId: uuidPattern,
  type: z.string().min(1).max(50),
  brand: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  serialNumber: z.string().max(100).optional(),
  accessoriesReceived: z.string().max(500).optional(),
  complaint: z.string().max(1000).optional(),
  passwordNote: z.string().max(200).optional(),
  createdAt: timestampPattern,
  updatedAt: timestampPattern,
  deletedAt: timestampPattern.optional(),
});

export const deviceCreateSchema = z.object({
  customerId: uuidPattern,
  type: z.string().min(1).max(50),
  brand: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  serialNumber: z.string().max(100).optional().transform((val) => val?.toUpperCase()),
  accessoriesReceived: z.string().max(500).optional(),
  complaint: z.string().max(1000).optional(),
  passwordNote: z.string().max(200).optional(),
});

// Job schemas
export const jobTaskSchema = z.object({
  id: uuidPattern,
  title: z.string().min(1).max(200),
  isDone: z.boolean(),
  order: z.number().int().min(0),
  createdAt: timestampPattern,
  updatedAt: timestampPattern,
});

export const jobStatusEventSchema = z.object({
  from: jobStatusSchema.optional(),
  to: jobStatusSchema,
  changedAt: timestampPattern,
  changedByUserId: uuidPattern,
});

export const jobSchema = z.object({
  id: uuidPattern,
  jobNo: z.string(),
  customerId: uuidPattern,
  deviceId: uuidPattern,
  status: jobStatusSchema,
  assignedUserId: uuidPattern.optional(),
  tasks: z.array(jobTaskSchema),
  internalNote: z.string().max(2000).optional(),
  customerNote: z.string().max(2000).optional(),
  laborCents: z.number().int().min(0),
  partsCents: z.number().int().min(0),
  discountCents: z.number().int().min(0),
  taxCents: z.number().int().min(0),
  createdAt: timestampPattern,
  updatedAt: timestampPattern,
  closedAt: timestampPattern.optional(),
  statusHistory: z.array(jobStatusEventSchema),
  deletedAt: timestampPattern.optional(),
});

export const jobCreateSchema = z.object({
  customerId: uuidPattern,
  deviceId: uuidPattern,
  assignedUserId: uuidPattern.optional(),
  tasks: z.array(z.object({ title: z.string().min(1).max(200) })).optional(),
  internalNote: z.string().max(2000).optional(),
  customerNote: z.string().max(2000).optional(),
});

// Line item schemas
export const lineItemSchema = z.object({
  id: uuidPattern,
  type: lineItemTypeSchema,
  description: z.string().min(1).max(500),
  quantity: z.number().positive(),
  unitPriceCents: z.number().int().min(0),
  lineTotalCents: z.number().int().min(0),
  productId: uuidPattern.optional(),
});

export const lineItemInputSchema = z.object({
  type: lineItemTypeSchema,
  description: z.string().min(1).max(500),
  quantity: z.number().positive().default(1),
  unitPriceCents: z.number().int().min(0),
  productId: uuidPattern.optional(),
});

// Quotation schemas
export const quotationSchema = z.object({
  id: uuidPattern,
  quotationNo: z.string(),
  jobId: uuidPattern.optional(),
  customerId: uuidPattern,
  deviceId: uuidPattern.optional(),
  status: quotationStatusSchema,
  validUntil: datePattern.optional(),
  lineItems: z.array(lineItemSchema),
  subtotalCents: z.number().int().min(0),
  discountCents: z.number().int().min(0),
  taxCents: z.number().int().min(0),
  totalCents: z.number().int().min(0),
  createdByUserId: uuidPattern,
  createdAt: timestampPattern,
  updatedAt: timestampPattern,
  deletedAt: timestampPattern.optional(),
});

export const quotationCreateSchema = z.object({
  jobId: uuidPattern.optional(),
  customerId: uuidPattern,
  deviceId: uuidPattern.optional(),
  validUntil: datePattern.optional(),
  lineItems: z.array(lineItemInputSchema).min(1),
  discountCents: z.number().int().min(0).default(0),
  taxCents: z.number().int().min(0).default(0),
});

// Invoice schemas
export const invoiceSchema = z.object({
  id: uuidPattern,
  invoiceNo: z.string(),
  quotationId: uuidPattern.optional(),
  jobId: uuidPattern.optional(),
  customerId: uuidPattern,
  deviceId: uuidPattern.optional(),
  status: invoiceStatusSchema,
  dueDate: datePattern.optional(),
  lineItems: z.array(lineItemSchema),
  subtotalCents: z.number().int().min(0),
  discountCents: z.number().int().min(0),
  taxCents: z.number().int().min(0),
  totalCents: z.number().int().min(0),
  amountPaidCents: z.number().int().min(0),
  balanceCents: z.number().int().min(0),
  createdByUserId: uuidPattern,
  cancelledAt: timestampPattern.optional(),
  cancelReason: z.string().max(500).optional(),
  createdAt: timestampPattern,
  updatedAt: timestampPattern,
  deletedAt: timestampPattern.optional(),
});

export const invoiceCreateSchema = z.object({
  quotationId: uuidPattern.optional(),
  jobId: uuidPattern.optional(),
  customerId: uuidPattern,
  deviceId: uuidPattern.optional(),
  dueDate: datePattern.optional(),
  lineItems: z.array(lineItemInputSchema).min(1),
  discountCents: z.number().int().min(0).default(0),
  taxCents: z.number().int().min(0).default(0),
});

// Payment schemas
export const paymentSchema = z.object({
  id: uuidPattern,
  invoiceId: uuidPattern,
  method: paymentMethodSchema,
  amountCents: z.number().int().positive(),
  reference: z.string().max(100).optional(),
  provider: z.string().max(50).optional(),
  receivedAt: timestampPattern,
  receivedByUserId: uuidPattern,
  note: z.string().max(500).optional(),
});

export const paymentCreateSchema = z.object({
  invoiceId: uuidPattern,
  method: paymentMethodSchema,
  amountCents: z.number().int().positive(),
  reference: z.string().max(100).optional(),
  provider: z.string().max(50).optional(),
  note: z.string().max(500).optional(),
}).refine(
  (data) => data.method !== 'online' || (data.reference && data.reference.length > 0),
  { message: 'Reference is required for online payments', path: ['reference'] }
);

// Receipt schemas
export const receiptSchema = z.object({
  id: uuidPattern,
  receiptNo: z.string(),
  invoiceId: uuidPattern,
  paidAt: timestampPattern,
  paymentIds: z.array(uuidPattern),
  totalPaidCents: z.number().int().positive(),
  createdByUserId: uuidPattern,
  createdAt: timestampPattern,
});

// Product schemas
export const productSchema = z.object({
  id: uuidPattern,
  name: z.string().min(1).max(200),
  sku: z.string().max(50).optional(),
  costCents: z.number().int().min(0),
  priceCents: z.number().int().min(0),
  stockQty: z.number().int().min(0),
  minStockQty: z.number().int().min(0),
  isActive: z.boolean(),
  createdAt: timestampPattern,
  updatedAt: timestampPattern,
});

export const productCreateSchema = z.object({
  name: z.string().min(1).max(200),
  sku: z.string().max(50).optional().transform((val) => val?.toUpperCase()),
  costCents: z.number().int().min(0),
  priceCents: z.number().int().min(0),
  stockQty: z.number().int().min(0).default(0),
  minStockQty: z.number().int().min(0).default(0),
});

// Stock movement schemas
export const stockMovementSchema = z.object({
  id: uuidPattern,
  productId: uuidPattern,
  type: stockMovementTypeSchema,
  deltaQty: z.number().int(),
  reason: z.string().max(500).optional(),
  invoiceId: uuidPattern.optional(),
  createdByUserId: uuidPattern,
  createdAt: timestampPattern,
});

export const stockAdjustSchema = z.object({
  productId: uuidPattern,
  type: z.enum(['in', 'out', 'adjust']),
  deltaQty: z.number().int(),
  reason: z.string().min(1).max(500),
});

// Settings schemas
export const companyProfileSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().max(500).optional(),
  phone: z.string().max(20).optional(),
  logoDataUrl: z.string().optional(),
});

export const documentNumberingSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  jobCounter: z.number().int().min(0),
  quotationCounter: z.number().int().min(0),
  invoiceCounter: z.number().int().min(0),
  receiptCounter: z.number().int().min(0),
});

export const printSettingsSchema = z.object({
  mode: z.enum(['a4', 'thermal']),
  thermalWidthMm: z.number().int().optional(),
});

export const settingsSchema = z.object({
  id: z.string(),
  companyProfile: companyProfileSchema,
  documentNumbering: documentNumberingSchema,
  printSettings: printSettingsSchema,
  updatedAt: timestampPattern,
});

// Audit event schema
export const auditEventSchema = z.object({
  id: uuidPattern,
  actorUserId: uuidPattern,
  action: z.string().min(1).max(100),
  entityType: z.string().min(1).max(50),
  entityId: z.string().min(1),
  summary: z.string().min(1).max(500),
  metadata: z.record(z.unknown()).optional(),
  createdAt: timestampPattern,
});

// Backup schema
export const backupDataSchema = z.object({
  users: z.array(userSchema),
  customers: z.array(customerSchema),
  devices: z.array(deviceSchema),
  jobs: z.array(jobSchema),
  quotations: z.array(quotationSchema),
  invoices: z.array(invoiceSchema),
  receipts: z.array(receiptSchema),
  payments: z.array(paymentSchema),
  products: z.array(productSchema),
  stockMovements: z.array(stockMovementSchema),
  auditEvents: z.array(auditEventSchema),
  settings: z.array(settingsSchema),
});

export const backupEnvelopeSchema = z.object({
  schemaVersion: z.string(),
  exportedAt: timestampPattern,
  app: z.literal('pos-servis-static'),
  data: backupDataSchema,
});

// Type exports
export type UserCreate = z.infer<typeof userCreateSchema>;
export type CustomerCreate = z.infer<typeof customerCreateSchema>;
export type DeviceCreate = z.infer<typeof deviceCreateSchema>;
export type JobCreate = z.infer<typeof jobCreateSchema>;
export type LineItemInput = z.infer<typeof lineItemInputSchema>;
export type QuotationCreate = z.infer<typeof quotationCreateSchema>;
export type InvoiceCreate = z.infer<typeof invoiceCreateSchema>;
export type PaymentCreate = z.infer<typeof paymentCreateSchema>;
export type ProductCreate = z.infer<typeof productCreateSchema>;
export type StockAdjust = z.infer<typeof stockAdjustSchema>;
