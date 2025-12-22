# Quickstart (Phase 1): POS + Servis Kedai Komputer (Static Web MVP)

**Feature**: `001-pos-servis-static`  
**Date**: 2025-12-22

> Nota: Dokumen ini menerangkan cara menjalankan aplikasi *selepas* implementasi dibuat (akan wujud `package.json` dan kod di `src/`).

## Prerequisites

- Node.js 20+ (LTS disyorkan)
- Package manager: `npm` atau `pnpm`

## Local Dev

1. Install dependencies
   - `npm install`
2. Run dev server
   - `npm run dev`
3. Buka URL yang dipaparkan (contoh: `http://localhost:5173`)

## Build (Static Output)

1. Build
   - `npm run build`
2. Preview build output
   - `npm run preview`

## PWA / Offline Test

- Selepas `npm run build` + `npm run preview`:
  - Buka aplikasi, kemudian putuskan internet dan refresh untuk sahkan app shell masih boleh load.
  - Cuba aliran kerja P1: create job → create invoice → record payment → generate receipt.
  - (Jika disokong) install PWA dari browser untuk uji mode skrin penuh.

## Tests (Jika disediakan)

- Unit/component tests:
  - `npm run test`
- E2E (optional):
  - `npm run test:e2e`

## Backup / Restore (Manual QA)

- Cipta beberapa rekod (customer/device/job/dokumen), kemudian:
  - Export backup → pastikan fail dimuat turun.
  - Clear all data → pastikan data kosong.
  - Import backup → pastikan data dipulihkan (hubungan customer↔device↔job↔dokumen kekal).
