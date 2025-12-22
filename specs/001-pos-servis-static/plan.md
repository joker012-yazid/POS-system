# Implementation Plan: POS + Servis Kedai Komputer (Static Web MVP)

**Branch**: `001-pos-servis-static` | **Date**: 2025-12-22 | **Spec**: `C:\Users\Jokeryazid\Documents\My projek\New pos sistem\POS-system\specs\001-pos-servis-static\spec.md`
**Input**: Feature specification from `C:\Users\Jokeryazid\Documents\My projek\New pos sistem\POS-system\specs\001-pos-servis-static\spec.md`

## Summary

Membina aplikasi web **statik** (SPA/PWA) untuk kedai servis komputer bagi mengurus: job servis (ticket +
status), pelanggan + peranti, quotation/invoice/receipt (print/PDF), pembayaran tunai/online (manual reference),
produk + stok asas, laporan ringkas, serta audit trail - semuanya **offline-first** dan data kekal di peranti
(IndexedDB) dengan fungsi export/import untuk backup.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.x + React 18 (build tool: Node.js 20 LTS)  
**Primary Dependencies**: Vite, React Router, Tailwind CSS, Dexie (IndexedDB), Zod, date-fns, vite-plugin-pwa  
**Storage**: IndexedDB (primary) + LocalStorage (small settings/session) + JSON export/import backup file  
**Testing**: Vitest + Testing Library (unit/component) + Playwright (optional E2E) + manual QA checklist  
**Target Platform**: Modern browsers (Chromium-based) di desktop Windows + telefon Android; installable PWA
**Project Type**: single (static SPA/PWA)  
**Performance Goals**: load awal < 2s (mid-range phone), carian < 1s (ribuan rekod), interaksi UI < 100ms  
**Constraints**: tiada backend, offline-first, print A4 wajib (thermal optional), terhad oleh storage quota browser  
**Scale/Scope**: 1 kedai, 1-5 staff, penggunaan utama 1 peranti; ribuan customer/job/dokumen (bukan "enterprise")

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Static-only delivery (Non-Negotiable)**: PASS - semua fungsi teras berjalan client-side; tiada runtime backend/DB server.
- **Offline-first PWA + UI responsif**: PASS - PWA installable + service worker untuk app shell; UI responsif mobile/desktop.
- **Data minimization & privacy**: PASS - data sensitif (cth. password peranti) tidak disimpan secara default; ada clear data + export/import.
- **Dokumen transaksi konsisten**: PASS - templat dokumen + penomboran unik + print/PDF A4; status dan kiraan konsisten.
- **Modular & upgrade-friendly**: PASS - domain modules + storage adapter; kontrak memudahkan migrasi ke backend/sync kemudian.

**Gate result (pre-research)**: PASS  
**Gate result (post-design)**: PASS (tiada perubahan skop yang melanggar constitution)

## Project Structure

### Documentation (this feature)

```text
specs/001-pos-servis-static/
  plan.md              # This file (/speckit.plan output)
  research.md          # Phase 0 output
  data-model.md        # Phase 1 output
  quickstart.md        # Phase 1 output
  contracts/           # Phase 1 output (OpenAPI schema)
  tasks.md             # Phase 2 output (/speckit.tasks - not created here)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
public/
  icons/
  logo/

src/
  app/
    routes/
  components/
  features/
    auth/
    customers/
    devices/
    jobs/
    documents/
    payments/
    products/
    reports/
    settings/
  lib/
    ids/
    money/
    time/
    validation/
  services/
    storage/
    audit/
    documents/
    export-import/
    pwa/
  styles/

tests/
  unit/
  e2e/                 # optional
```

**Structure Decision**: Single static web project (SPA/PWA) di repository root (`src/` + `public/`).
Tiada backend folder kerana constraint "static-only".

## Complexity Tracking

Tiada pelanggaran Constitution Check yang memerlukan justifikasi tambahan.
