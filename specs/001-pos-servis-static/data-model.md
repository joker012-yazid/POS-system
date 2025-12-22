# Data Model (Phase 1): POS + Servis Kedai Komputer (Static Web MVP)

**Feature**: `001-pos-servis-static`  
**Date**: 2025-12-22  
**Source**: `C:\Users\Jokeryazid\Documents\My projek\New pos sistem\POS-system\specs\001-pos-servis-static\spec.md`

## Storage Model

- **Primary store**: IndexedDB
- **Backup**: JSON export/import file with `schemaVersion`
- **IDs**: `UUIDv4` string (generated via `crypto.randomUUID()`)
- **Timestamps**: ISO-8601 string (UTC recommended), e.g. `2025-12-22T12:34:56Z`
- **Money**: integer `cents` (MYR) to avoid floating point errors
- **Soft delete**: optional `deletedAt` timestamp; never hard-delete critical financial records

## Enumerations

### Roles
- `ADMIN`
- `USER`

### JobStatus
- `RECEIVED`
- `DIAGNOSE`
- `QUOTED`
- `IN_PROGRESS`
- `READY`
- `CLOSED`

### QuotationStatus
- `DRAFT`
- `SENT`
- `ACCEPTED`
- `REJECTED`
- `EXPIRED`

### InvoiceStatus
- `UNPAID`
- `PARTIALLY_PAID`
- `PAID`
- `CANCELLED`

### PaymentMethod
- `CASH`
- `ONLINE`

### StockMovementType
- `IN`
- `OUT`
- `ADJUST`
- `SALE`
- `RETURN`

## Entities

### User
Represents akaun pengguna tempatan (device-local gating).

- `id` (UUID, required)
- `username` (string, required, unique, normalized lowercase)
- `displayName` (string, required)
- `role` (Role, required)
- `isActive` (boolean, required, default true)
- `passwordHash` (string, required)
- `passwordSalt` (string, required)
- `createdAt`, `updatedAt` (timestamp, required)
- `lastLoginAt` (timestamp, optional)

### Customer

- `id` (UUID, required)
- `name` (string, required)
- `phone` (string, required, normalized; not necessarily unique)
- `email` (string, optional)
- `address` (string, optional)
- `tags` (string[], optional)
- `createdAt`, `updatedAt` (timestamp, required)
- `deletedAt` (timestamp, optional)

### Device

- `id` (UUID, required)
- `customerId` (UUID, required)
- `type` (string, required; e.g., laptop/desktop/others)
- `brand` (string, optional)
- `model` (string, optional)
- `serialNumber` (string, optional; normalized uppercase)
- `accessoriesReceived` (string, optional)
- `complaint` (string, optional)
- `passwordNote` (string, optional; MUST be opt-in; store masked display only)
- `createdAt`, `updatedAt` (timestamp, required)
- `deletedAt` (timestamp, optional)

Relationships:
- `Customer (1) -> (N) Device`

### Job

- `id` (UUID, required)
- `jobNo` (string, required, unique; e.g., `JS-2025-000123`)
- `customerId` (UUID, required)
- `deviceId` (UUID, required)
- `status` (JobStatus, required)
- `assignedUserId` (UUID, optional)
- `tasks` (JobTask[], required, default empty)
- `internalNote` (string, optional)
- `customerNote` (string, optional)
- `laborCents` (int, optional, default 0)
- `partsCents` (int, optional, default 0)
- `discountCents` (int, optional, default 0)
- `taxCents` (int, optional, default 0)
- `createdAt`, `updatedAt` (timestamp, required)
- `closedAt` (timestamp, optional)
- `statusHistory` (JobStatusEvent[], required)
- `deletedAt` (timestamp, optional; discouraged for jobs)

`JobStatusEvent`:
- `from` (JobStatus, optional for first entry)
- `to` (JobStatus, required)
- `changedAt` (timestamp, required)
- `changedByUserId` (UUID, required)

State rules:
- Must follow allowed transitions in spec (Received -> Diagnose -> Quoted -> In Progress -> Ready -> Closed).
- Any out-of-order change MUST be logged and require admin confirmation (optional rule).

### JobTask

- `id` (UUID, required)
- `title` (string, required)
- `isDone` (boolean, required, default false)
- `order` (int, required)
- `createdAt`, `updatedAt` (timestamp, required)

### Quotation

- `id` (UUID, required)
- `quotationNo` (string, required, unique; e.g., `QT-2025-000001`)
- `jobId` (UUID, optional)
- `customerId` (UUID, required)
- `deviceId` (UUID, optional)
- `status` (QuotationStatus, required)
- `validUntil` (date string `YYYY-MM-DD`, optional)
- `lineItems` (LineItem[], required)
- `subtotalCents` (int, required)
- `discountCents` (int, required)
- `taxCents` (int, required)
- `totalCents` (int, required)
- `createdByUserId` (UUID, required)
- `createdAt`, `updatedAt` (timestamp, required)
- `deletedAt` (timestamp, optional; discouraged)

### Invoice

- `id` (UUID, required)
- `invoiceNo` (string, required, unique; e.g., `INV-2025-000001`)
- `quotationId` (UUID, optional)
- `jobId` (UUID, optional)
- `customerId` (UUID, required)
- `deviceId` (UUID, optional)
- `status` (InvoiceStatus, required)
- `dueDate` (date string `YYYY-MM-DD`, optional)
- `lineItems` (LineItem[], required)
- `subtotalCents`, `discountCents`, `taxCents`, `totalCents` (int, required)
- `amountPaidCents` (int, required, default 0)
- `balanceCents` (int, required)
- `createdByUserId` (UUID, required)
- `cancelledAt` (timestamp, optional)
- `cancelReason` (string, optional)
- `createdAt`, `updatedAt` (timestamp, required)
- `deletedAt` (timestamp, optional; MUST NOT delete paid/cancelled invoices)

Rules:
- `balanceCents = totalCents - amountPaidCents`
- `status` auto-updates based on payments (UNPAID/PARTIALLY_PAID/PAID).

### Receipt

- `id` (UUID, required)
- `receiptNo` (string, required, unique; e.g., `RC-2025-000001`)
- `invoiceId` (UUID, required)
- `paidAt` (timestamp, required)
- `paymentIds` (UUID[], required)
- `totalPaidCents` (int, required)
- `createdByUserId` (UUID, required)
- `createdAt` (timestamp, required)

### LineItem

- `id` (UUID, required)
- `type` (string, required; `SERVICE` or `PRODUCT`)
- `description` (string, required)
- `quantity` (number, required, default 1)
- `unitPriceCents` (int, required)
- `lineTotalCents` (int, required)
- `productId` (UUID, optional; required when `type=PRODUCT`)

Rules:
- `lineTotalCents = quantity * unitPriceCents` (after rounding rules if quantity supports decimals).

### Payment

- `id` (UUID, required)
- `invoiceId` (UUID, required)
- `method` (PaymentMethod, required)
- `amountCents` (int, required; > 0)
- `reference` (string, optional; required for ONLINE)
- `provider` (string, optional; bank/eWallet label)
- `receivedAt` (timestamp, required)
- `receivedByUserId` (UUID, required)
- `note` (string, optional)

Rules:
- Sum of payments MUST NOT exceed `invoice.totalCents` (unless refund flow is defined).

### Product

- `id` (UUID, required)
- `name` (string, required)
- `sku` (string, optional, normalized uppercase)
- `costCents` (int, required, >= 0)
- `priceCents` (int, required, >= 0)
- `stockQty` (int, required, >= 0)
- `minStockQty` (int, required, >= 0)
- `isActive` (boolean, required, default true)
- `createdAt`, `updatedAt` (timestamp, required)

### StockMovement

- `id` (UUID, required)
- `productId` (UUID, required)
- `type` (StockMovementType, required)
- `deltaQty` (int, required; can be negative for OUT/SALE)
- `reason` (string, optional; required for ADJUST)
- `invoiceId` (UUID, optional; when movement relates to sale/return)
- `createdByUserId` (UUID, required)
- `createdAt` (timestamp, required)

Rule:
- Stock is derived by applying movements or updated directly with movement log; but UI MUST show a consistent single source of truth.

### Settings

- `id` (fixed string, e.g., `SETTINGS`, required)
- `companyProfile` (CompanyProfile, required)
- `documentNumbering` (DocumentNumbering, required)
- `printSettings` (PrintSettings, required)
- `updatedAt` (timestamp, required)

`CompanyProfile`:
- `name` (string, required)
- `address` (string, optional)
- `phone` (string, optional)
- `logoDataUrl` (string, optional)

`DocumentNumbering`:
- `year` (int, required)
- `jobCounter` (int, required)
- `quotationCounter` (int, required)
- `invoiceCounter` (int, required)
- `receiptCounter` (int, required)

`PrintSettings`:
- `mode` (string, required; `A4` or `THERMAL`)
- `thermalWidthMm` (int, optional; 58 or 80)

### AuditEvent
Append-only log for critical actions.

- `id` (UUID, required)
- `actorUserId` (UUID, required)
- `action` (string, required; e.g., `JOB_STATUS_CHANGED`, `INVOICE_CANCELLED`, `PAYMENT_RECORDED`, `STOCK_ADJUSTED`)
- `entityType` (string, required)
- `entityId` (UUID|string, required)
- `summary` (string, required)
- `metadata` (object, optional)
- `createdAt` (timestamp, required)

## Backup File Format

### BackupEnvelope

- `schemaVersion` (string, required; e.g., `1.0.0`)
- `exportedAt` (timestamp, required)
- `app` (string, required; e.g., `pos-servis-static`)
- `data` (BackupData, required)

`BackupData` contains arrays for each entity store:
- `users`, `customers`, `devices`, `jobs`, `quotations`, `invoices`, `receipts`, `payments`, `products`, `stockMovements`, `auditEvents`, `settings`

Import rules:
- Validate `schemaVersion` and required fields before applying.
- Detect and reject duplicate `jobNo`/`quotationNo`/`invoiceNo`/`receiptNo` unless import mode explicitly merges.
- If any validation fails, import MUST abort without partial changes.
