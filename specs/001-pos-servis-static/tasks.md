---
description: "Task list for implementing the static web POS + servis MVP"
---

# Tasks: POS + Servis Kedai Komputer (Static Web MVP)

**Input**: Design documents in `specs/001-pos-servis-static/`  
**Prerequisites**: `specs/001-pos-servis-static/plan.md`, `specs/001-pos-servis-static/spec.md`, `specs/001-pos-servis-static/research.md`, `specs/001-pos-servis-static/data-model.md`, `specs/001-pos-servis-static/contracts/openapi.yaml`

**Tests**: Tiada tugas TDD automatik dijana (tidak diminta dalam spec). Manual QA disertakan dalam fasa akhir.

**Organization**: Tasks dipecahkan mengikut user story supaya setiap story boleh disiapkan dan diuji secara berperingkat.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Boleh dibuat selari (fail berbeza, tiada dependency pada tugas lain yang belum siap)
- **[Story]**: Label user story (US1, US2, US3, dll.) - hanya untuk fasa user story
- Setiap tugas mesti nyatakan file path yang tepat

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inisialisasi projek dan scaffolding asas

- [ ] T001 Scaffold Vite React TypeScript app di repo root (hasilkan `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`)
- [ ] T002 Tambah dependencies + scripts (dev/build/preview/lint/test) dalam `package.json`
- [ ] T003 [P] Setup Tailwind + global styles dalam `tailwind.config.ts`, `postcss.config.js`, `src/styles/globals.css`, dan import di `src/main.tsx`
- [ ] T004 [P] Setup ESLint + Prettier dalam `eslint.config.js` (atau `.eslintrc.cjs`), `.prettierrc`, `.prettierignore`
- [ ] T005 [P] Setup Vitest + Testing Library scaffold dalam `vite.config.ts` (test config) dan `tests/unit/setup.ts`
- [ ] T006 [P] Setup PWA (offline app shell) dalam `vite.config.ts`, `public/manifest.webmanifest`, dan aset `public/icons/*`
- [ ] T007 Cipta skeleton folder + komponen UI asas dalam `src/app/`, `src/components/ui/*`, `src/services/`, `src/features/`, `src/lib/`, `tests/`
- [ ] T008 Setup router + app shell asas dalam `src/app/router.tsx`, `src/app/App.tsx`, `src/components/AppShell.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infrastruktur teras yang wajib siap sebelum mula user stories

- [ ] T009 Definisikan enums + types berdasarkan `data-model.md` dalam `src/services/storage/types.ts`
- [ ] T010 Definisikan Zod schemas untuk entity + input validation dalam `src/services/storage/schemas.ts`
- [ ] T011 [P] Sediakan util duit (cents) dan masa dalam `src/lib/money.ts` dan `src/lib/time.ts`
- [ ] T012 Implement Dexie IndexedDB schema + versioning dalam `src/services/storage/db.ts`
- [ ] T013 Implement seed + clear-all helper dalam `src/services/storage/seed.ts` dan `src/services/storage/clearAll.ts`
- [ ] T014 Implement repositories untuk semua stores dalam `src/services/storage/repos/*.ts` (users, customers, devices, jobs, documents, payments, products, stock, audit, settings)
- [ ] T015 Implement audit service (append-only) dalam `src/services/audit/auditService.ts`
- [ ] T016 Implement settings service (company profile, print settings, numbering counters) dalam `src/features/settings/settingsService.ts`
- [ ] T017 Implement document numbering service (counter per tahun) dalam `src/services/documents/numberingService.ts`
- [ ] T018 Implement auth hashing + auth service dalam `src/features/auth/password.ts` dan `src/features/auth/authService.ts`
- [ ] T019 Implement auth provider + route guard + session handling dalam `src/features/auth/AuthProvider.tsx`, `src/features/auth/RequireAuth.tsx`, `src/features/auth/session.ts`
- [ ] T020 Implement login UI dan route `/login` dalam `src/features/auth/LoginPage.tsx` dan `src/app/router.tsx`
- [ ] T021 Implement toast + confirm dialog dalam `src/components/ToastHost.tsx` dan `src/components/ConfirmDialog.tsx`
- [ ] T022 Implement print helper + base print route dalam `src/services/documents/print/printService.ts` dan `src/app/routes/PrintPreviewPage.tsx`
- [ ] T023 Implement Customers module (service + list/detail/form) dalam `src/features/customers/*`
- [ ] T024 Implement Devices module (service + list/detail/form) dalam `src/features/devices/*`
- [ ] T025 Implement Users admin module (create/disable/reset) dalam `src/features/users/*` (admin-only)
- [ ] T026 Wire navigation + protected routes (dashboard placeholder) dalam `src/app/nav.ts`, `src/components/AppShell.tsx`, `src/app/router.tsx`

**Checkpoint**: Foundation ready - user story implementation boleh bermula

---

## Phase 3: User Story 1 - Job Servis (Ticket) + Status (Priority: P1)

**Goal**: Cipta job servis dengan nombor unik, status workflow, checklist tugas, assignment staff, dan history

**Independent Test**: Cipta customer + device (foundation) → create job → ubah status → refresh/offline → data kekal

- [ ] T027 [US1] Implement job service (CRUD, status transitions, history, numbering, audit) dalam `src/features/jobs/jobService.ts`
- [ ] T028 [P] [US1] Implement status stepper component dalam `src/features/jobs/JobStatusStepper.tsx`
- [ ] T029 [P] [US1] Implement checklist component dalam `src/features/jobs/JobTasksChecklist.tsx`
- [ ] T030 [P] [US1] Implement assignment component (assign staff) dalam `src/features/jobs/JobAssignment.tsx`
- [ ] T031 [P] [US1] Implement jobs list page (search + filter status) dalam `src/features/jobs/JobsListPage.tsx`
- [ ] T032 [P] [US1] Implement job create page/form (select customer+device) dalam `src/features/jobs/JobCreatePage.tsx` dan `src/features/jobs/JobForm.tsx`
- [ ] T033 [US1] Implement job detail page (compose stepper+checklist+assignment) dalam `src/features/jobs/JobDetailPage.tsx`
- [ ] T034 [US1] Wire routes `/jobs`, `/jobs/new`, `/jobs/:id` dalam `src/app/router.tsx` dan nav entry dalam `src/app/nav.ts`
- [ ] T035 [US1] Tambah job quick-search (jobNo) di header dalam `src/components/AppShell.tsx` (route ke job detail atau `/search`)

---

## Phase 4: User Story 2 - Sebutharga (Quotation) Profesional (Priority: P1)

**Goal**: Create quotation (standalone atau dari job), line items, status, dan print/PDF A4

**Independent Test**: Create quotation → set status → print preview/PDF → data kekal selepas refresh

- [ ] T036 [US2] Implement line items helper (kiraan totals) dalam `src/features/documents/lineItems.ts`
- [ ] T037 [US2] Implement quotation service (CRUD, status, validity, totals, audit) dalam `src/features/documents/quotations/quotationService.ts`
- [ ] T038 [P] [US2] Implement quotation create page/form dalam `src/features/documents/quotations/QuotationCreatePage.tsx` dan `src/features/documents/quotations/QuotationForm.tsx`
- [ ] T039 [P] [US2] Implement quotations list page dalam `src/features/documents/quotations/QuotationsListPage.tsx`
- [ ] T040 [P] [US2] Implement quotation detail page dalam `src/features/documents/quotations/QuotationDetailPage.tsx`
- [ ] T041 [US2] Implement quotation print page (A4) dalam `src/features/documents/quotations/QuotationPrintPage.tsx`
- [ ] T042 [US2] Wire routes quotation dalam `src/app/router.tsx` dan nav entry dalam `src/app/nav.ts`
- [ ] T043 [US2] Tambah action "Create quotation from job" dalam `src/features/jobs/JobDetailPage.tsx`

---

## Phase 5: User Story 3 - Invois, Pembayaran (Tunai/Online), dan Resit (Priority: P1)

**Goal**: Create invoice (standalone/convert dari quotation), rekod payment (partial), auto status, dan resit + print/PDF

**Independent Test**: Create invoice → record partial + final payment → invoice jadi Paid → receipt boleh dijana/print semula

- [ ] T044 [US3] Implement invoice service (CRUD, totals, status rules, cancel, audit) dalam `src/features/documents/invoices/invoiceService.ts`
- [ ] T045 [US3] Implement payment service (validation, prevent overpay, online reference) dalam `src/features/payments/paymentService.ts`
- [ ] T046 [US3] Implement receipt service (generate bila invoice Paid) dalam `src/features/documents/receipts/receiptService.ts`
- [ ] T047 [P] [US3] Implement invoice create page/form dalam `src/features/documents/invoices/InvoiceCreatePage.tsx` dan `src/features/documents/invoices/InvoiceForm.tsx`
- [ ] T048 [P] [US3] Implement invoices list page dalam `src/features/documents/invoices/InvoicesListPage.tsx`
- [ ] T049 [P] [US3] Implement invoice detail page (payments panel) dalam `src/features/documents/invoices/InvoiceDetailPage.tsx`
- [ ] T050 [P] [US3] Implement payment form component dalam `src/features/payments/PaymentForm.tsx`
- [ ] T051 [US3] Implement invoice print page (A4) dalam `src/features/documents/invoices/InvoicePrintPage.tsx`
- [ ] T052 [US3] Implement receipt print page (A4) dalam `src/features/documents/receipts/ReceiptPrintPage.tsx`
- [ ] T053 [US3] Wire routes invoice/receipt dalam `src/app/router.tsx` + nav entry, dan tambah "Convert quotation to invoice" action dalam `src/features/documents/quotations/QuotationDetailPage.tsx`

---

## Phase 6: User Story 5 - Backup/Restore Data + Audit Trail (Priority: P2)

**Goal**: Export/import backup JSON, clear data, dan audit log viewer untuk tindakan penting

**Independent Test**: Isi data → export → clear all → import → data pulih + audit event direkodkan

- [ ] T054 [US5] Definisikan backup envelope schema + version dalam `src/services/export-import/backupSchema.ts`
- [ ] T055 [US5] Implement export/import services (all-or-nothing + conflict detection) dalam `src/services/export-import/exportService.ts` dan `src/services/export-import/importService.ts`
- [ ] T056 [P] [US5] Implement Settings page (company profile, print settings, export/import, clear data) dalam `src/features/settings/SettingsPage.tsx`
- [ ] T057 [P] [US5] Implement audit log viewer page dalam `src/features/audit/AuditLogPage.tsx`
- [ ] T058 [US5] Wire routes `/settings` dan `/audit` dalam `src/app/router.tsx` + nav entry dalam `src/app/nav.ts`
- [ ] T059 [US5] Log audit events untuk export/import/clear data dalam `exportService.ts`, `importService.ts`, `src/services/storage/clearAll.ts`
- [ ] T060 [US5] Kemaskini manual QA steps backup/restore dalam `specs/001-pos-servis-static/quickstart.md`

---

## Phase 7: User Story 4 - Produk & Inventori Asas (Priority: P2)

**Goal**: Product CRUD, stock movements, low stock alert, dan auto-decrement stok bila invoice Paid

**Independent Test**: Create product + adjust stock → buat invoice (product line item) → bayar sampai Paid → stok berkurang + movement log

- [ ] T061 [US4] Implement product service (CRUD + low stock) dalam `src/features/products/productService.ts`
- [ ] T062 [US4] Implement stock movement service (IN/OUT/ADJUST/SALE) dalam `src/features/products/stockService.ts`
- [ ] T063 [P] [US4] Implement products list page dalam `src/features/products/ProductsListPage.tsx`
- [ ] T064 [P] [US4] Implement product form dalam `src/features/products/ProductForm.tsx`
- [ ] T065 [P] [US4] Implement stock adjust dialog + movements page dalam `src/features/products/StockAdjustDialog.tsx` dan `src/features/products/StockMovementsPage.tsx`
- [ ] T066 [US4] Wire routes product dalam `src/app/router.tsx` + nav entry dalam `src/app/nav.ts`
- [ ] T067 [US4] Integrate invoice Paid → create SALE stock movements + decrement stok dalam `src/features/documents/receipts/receiptService.ts`
- [ ] T068 [US4] Pastikan audit events untuk product/stock direkod + expose low stock count helper dalam `src/features/products/productService.ts`

---

## Phase 8: User Story 6 - Dashboard + Laporan Ringkas (Priority: P3)

**Goal**: Dashboard summary cards + laporan harian/bulanan + carian global

**Independent Test**: Dengan sample data, dashboard/report memaparkan kiraan yang konsisten (jobs today, unpaid invoices, low stock, total sales)

- [ ] T069 [US6] Implement report aggregation service dalam `src/features/reports/reportService.ts`
- [ ] T070 [P] [US6] Implement dashboard page dalam `src/features/reports/DashboardPage.tsx`
- [ ] T071 [P] [US6] Implement reports page (daily/monthly) dalam `src/features/reports/ReportsPage.tsx`
- [ ] T072 [P] [US6] Implement global search page + service dalam `src/features/search/SearchPage.tsx` dan `src/features/search/searchService.ts`
- [ ] T073 [US6] Wire routes `/dashboard`, `/reports`, `/search` + header search dalam `src/app/router.tsx` dan `src/components/AppShell.tsx`
- [ ] T074 [US6] Kemaskini manual QA steps dashboard/reports/search dalam `specs/001-pos-servis-static/quickstart.md`

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Kemasan untuk print, PWA UX, accessibility, dan reliability

- [ ] T075 [P] Tambah print CSS (A4 + thermal optional) dalam `src/styles/print.css` dan apply pada print pages
- [ ] T076 Implement PWA offline indicator + update prompt dalam `src/services/pwa/pwaService.ts` dan `src/components/PwaStatusBanner.tsx`
- [ ] T077 [P] Standardize error handling + user-friendly messages dalam `src/lib/errors.ts` dan integrate dengan `src/components/ToastHost.tsx`
- [ ] T078 [P] Accessibility pass untuk pages utama (login, job, invoice, settings) dalam `src/features/**`
- [ ] T079 [P] Performance polish (debounce search) dalam `src/lib/debounce.ts` dan guna dalam `src/features/search/searchService.ts`
- [ ] T080 Jalankan full manual validation dan rekod hasil dalam `specs/001-pos-servis-static/validation-notes.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Tiada dependencies
- **Foundational (Phase 2)**: BLOCKS semua user story
- **US1/US2/US3 (P1)**: Boleh mula selepas Foundational (US3 bergantung kepada US2 untuk flow convert quotation → invoice)
- **US5/US4 (P2)**: Boleh mula selepas P1 (disyorkan buat US5 dulu sebab backup/clear data adalah keperluan penting untuk versi statik)
- **US6 (P3)**: Selepas data/dokumen stabil
- **Polish**: Selepas semua story yang dipilih siap

### User Story Dependencies

- **US1**: Tiada dependency selain Foundational
- **US2**: Tiada dependency selain Foundational (integrasi "from job" guna US1)
- **US3**: Disyorkan selepas US2 (untuk "from accepted quotation"); boleh dibuat standalone tanpa convert jika diperlukan
- **US4**: Bergantung pada US3 untuk auto stock decrement bila invoice Paid
- **US5**: Tiada dependency selain Foundational (tetapi perlu audit service + clearAll)
- **US6**: Bergantung pada data dari US1/US3/US4 untuk kiraan dashboard/report

---

## Parallel Example (after Foundational)

**US1 (Jobs)**:
- Selari: T028, T029, T030, T031, T032 (komponen/list/form/assignment) selepas T027 siap

**US2 (Quotations)**:
- Selari: T038, T039, T040 selepas T037 siap

**US3 (Invoices/Payments)**:
- Selari: T047, T048, T049, T050 selepas T044–T046 siap

---

## Implementation Strategy

### Suggested MVP Scope (Static Web Core Workflow)

1. Phase 1 + Phase 2 (Setup + Foundational)
2. US1 (Jobs)
3. US2 (Quotations)
4. US3 (Invoices/Payments/Receipts)
5. US5 (Backup/Clear Data + Audit) - sebelum dianggap "ready untuk kedai"
6. STOP dan lakukan manual validation (T080)

### Incremental Delivery

- Selepas setiap user story, pastikan ia boleh diuji secara berdikari (ikut "Independent Test" di setiap fasa)
- Elakkan tambah ciri yang perlukan backend (kekal selari dengan constitution "static-only")
