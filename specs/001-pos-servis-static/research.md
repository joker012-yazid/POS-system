# Phase 0 Research: POS + Servis Kedai Komputer (Static Web MVP)

**Feature**: `001-pos-servis-static`  
**Date**: 2025-12-22  
**Inputs**: `C:\Users\Jokeryazid\Documents\My projek\New pos sistem\POS-system\specs\001-pos-servis-static\spec.md`, `C:\Users\Jokeryazid\Documents\My projek\New pos sistem\POS-system\.specify\memory\constitution.md`, `C:\Users\Jokeryazid\Documents\My projek\New pos sistem\POS-system\Sistem Pengurusan Jual Beli dan Servis Kedai Komputer (Web-Based).pdf`

## Decisions

### Decision: Static SPA + PWA (offline-first)
- **Decision**: Bina sebagai Single Page App (SPA) yang boleh di-host sebagai fail statik, dengan PWA untuk install + offline caching.
- **Rationale**: Selari dengan constitution "static-only" dan keperluan UX kaunter (pantas, responsif, boleh guna bila internet putus).
- **Alternatives considered**:
  - Static export framework (cth. SSR framework dengan export statik): lebih berat dan tidak perlu untuk MVP.
  - Non-PWA: kurang sesuai untuk offline + pengalaman seperti app.

### Decision: Local-first storage via IndexedDB (Dexie)
- **Decision**: Gunakan IndexedDB sebagai storan utama, dibantu library wrapper (Dexie) untuk schema/versioning/migrations.
- **Rationale**: Data transaksi/job/dokumen boleh jadi besar; LocalStorage tidak sesuai untuk dataset besar dan query kompleks.
- **Alternatives considered**:
  - LocalStorage sahaja: mudah tapi cepat jadi bottleneck (kapasiti kecil, query sukar).
  - SQLite WASM: kuat tetapi lebih kompleks untuk MVP.

### Decision: Export/Import backup sebagai fail JSON berschema
- **Decision**: Sediakan export/import satu fail JSON dengan `schemaVersion` + metadata (tarikh export) dan validasi semasa import.
- **Rationale**: Static web tiada cloud sync; backup/restore ialah mekanisme utama pindah peranti dan pemulihan data.
- **Alternatives considered**:
  - Backup automatik ke cloud: melanggar constraint "static-only" untuk MVP.

### Decision: Dokumen transaksi melalui templat HTML + CSS print (PDF via browser print-to-PDF)
- **Decision**: Dokumen (quotation/invoice/receipt) dijana sebagai templat HTML print-ready (A4 wajib), dan PDF dihasilkan melalui
  fungsi cetak browser (print-to-PDF). Thermal adalah optional (CSS print layout berbeza).
- **Rationale**: Kaedah paling stabil untuk static web tanpa backend; hasilnya konsisten dan mudah diselenggara.
- **Alternatives considered**:
  - Generate PDF sepenuhnya client-side (cth. pdf-lib/jsPDF): boleh dibuat kemudian jika perlukan fail PDF “native”, tetapi lebih kompleks.

### Decision: Penomboran dokumen berasaskan counter per jenis + tahun
- **Decision**: Simpan counter berasingan untuk `Job`, `Quotation`, `Invoice`, `Receipt` mengikut tahun semasa; jana nombor seperti
  `JS-YYYY-######`, `QT-YYYY-######`, `INV-YYYY-######`, `RC-YYYY-######`.
- **Rationale**: Mudah difahami, konsisten, dan boleh diaudit; senang elak duplicate dengan semakan unique semasa generate/import.
- **Alternatives considered**:
  - UUID sebagai nombor dokumen untuk pelanggan: kurang mesra pengguna.

### Decision: Local auth untuk UX gating (bukan keselamatan sebenar)
- **Decision**: Login Admin/User untuk kawal akses dalam peranti yang sama; simpan kredensial secara local (hash) dan guna session tempatan.
- **Rationale**: Selari dengan scope static; elakkan false sense of security dengan jelas menyatakan ia “device-local gating”.
- **Alternatives considered**:
  - SSO/OAuth/Server auth: memerlukan backend, out-of-scope untuk versi statik.

### Decision: Audit trail append-only
- **Decision**: Simpan `AuditEvent` append-only untuk tindakan kritikal (status job, cancel invoice, payment, stock adjustment, import/clear data).
- **Rationale**: Menggantikan “server audit log” dalam konteks local-only dan memudahkan troubleshooting.
- **Alternatives considered**:
  - Tiada audit trail: menyukarkan semakan bila berlaku kesilapan.

### Decision: Testing baseline
- **Decision**: Unit/component tests untuk logik kiraan, penomboran, import validation, dan workflow status; E2E optional untuk flows utama.
- **Rationale**: Risiko bug tinggi pada kiraan duit & numbering; tests memberi keyakinan walaupun MVP.
- **Alternatives considered**:
  - Manual-only: cepat tetapi mudah terlepas regression.

## Best Practices (ringkas)

- **Money**: simpan sebagai integer `cents` untuk elak isu float; format ke MYR hanya di UI.
- **Import safety**: import mesti “all-or-nothing” (transaction-like); jika validasi gagal, jangan ubah data sedia ada.
- **Service worker**: cache app shell + aset statik sahaja; data transaksi kekal di IndexedDB (jangan cache response data sensitif).
- **Migrations**: setiap perubahan schema IndexedDB perlu migration step dan `schemaVersion` di backup.

## Risks & Mitigations

- **Storage quota browser**: paparkan amaran bila data besar dan sediakan export berkala.
- **Data hilang (peranti rosak/clear storage)**: galakkan backup (export) dan sediakan reminder dalam Settings.
- **Service worker update**: guna strategi update yang jelas (auto-update + prompt reload) supaya tak ganggu operasi kaunter.
