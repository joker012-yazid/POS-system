<!--
Sync Impact Report
- Version change: template -> 1.0.0
- Principles: Initialized (5)
- Added sections: Scope & Constraints (Static Web), Workflow & Quality Gates
- Templates requiring updates: none
- Deferred TODOs: none
-->

# Sistem Pengurusan Jual Beli & Servis Kedai Komputer (Static Web) Constitution

## Core Principles

### 1) Static-Only Delivery (Non-Negotiable)
Sistem MUST boleh dijalankan sepenuhnya dalam pelayar (HTML/CSS/JS) dan di-host sebagai fail statik
tanpa runtime backend (tiada server-side rendering wajib, tiada DB server). Penyimpanan data MUST
menggunakan storan tempatan (IndexedDB/LocalStorage) dan/atau import/export fail (cth. JSON). Jika
sesuatu ciri memerlukan backend untuk keselamatan atau multi-user sebenar, ia MUST ditandakan sebagai
out-of-scope untuk versi statik dan dirancang sebagai upgrade berasingan.

### 2) Offline-First PWA + UI Responsif
Antaramuka MUST responsif untuk telefon pintar dan laptop. Sistem SHOULD menyokong PWA (installable)
dan offline caching untuk aliran kerja teras (customer/device, job servis, dokumen transaksi, rekod bayaran).
Prestasi MUST sesuai untuk kegunaan kaunter: load cepat, interaksi segera, dan tanpa UI "lag".

### 3) Data Minimization & Privacy by Default
Sistem MUST simpan data minimum yang diperlukan untuk operasi kedai (pelanggan, peranti, job, dokumen,
bayaran, produk/stok). Data sensitif seperti password peranti MUST tidak disimpan secara default; jika
benar-benar perlu, ia MUST opt-in, dipaparkan masked, dan mempunyai tindakan jelas untuk padam.
Sistem MUST menyediakan cara mudah untuk backup/restore (export/import) dan 'clear all local data'.

### 4) Dokumen Transaksi Konsisten (Quotation/Invoice/Receipt)
Sistem MUST menjana dokumen profesional dan konsisten menggunakan templat (logo, alamat, nombor
dokumen, tarikh, item/servis, jumlah). Output MUST menyokong print (A4 dan/atau thermal) dan/atau PDF
secara client-side. Nombor dokumen MUST unik dan boleh diaudit pada storan tempatan (termasuk status
bayaran tunai/online dengan rujukan transaksi untuk online).

### 5) Modular, Template-Based, Upgrade-Friendly
Kod MUST modular mengikut domain (Customers/Devices, Jobs/Servis, Dokumen, Payments, Inventory,
Reports) dan templat UI/dokumen MUST boleh dikemaskini tanpa ubah logik teras. Semua operasi storan
MUST melalui lapisan 'storage adapter' tunggal supaya migrasi ke backend/sync boleh dibuat kemudian.
Sistem SHOULD kekal ringkas (YAGNI) dan fokus kepada MVP yang benar-benar digunakan di kaunter.

## Scope & Constraints (Static Web)

- **Domain MVP**: Rekod job/ticket servis (status), pelanggan + peranti, sebutharga/quotation, invois,
  resit, dan rekod bayaran tunai/online (online = simpan reference manual).
- **Auth/Roles**: Jika ada "Admin/User", ia hanya untuk UX gating pada peranti yang sama (bukan
  keselamatan sebenar). Tiada multi-user serentak atau cloud sync dalam versi statik.
- **Storan & backup**: Data kekal di peranti; export/import (JSON) digunakan untuk pindah/backup.
- **Integrasi**: Tiada payment gateway wajib dalam versi statik; integrasi (gateway/WhatsApp/SMS) hanya
  dibenarkan jika ia boleh beroperasi tanpa backend atau ditetapkan sebagai fasa upgrade.

## Workflow & Quality Gates

- Setiap feature MUST ada `spec.md` dengan user stories + acceptance scenarios yang boleh diuji.
- Setiap plan MUST menyertakan "Constitution Check" (static-only, privacy, dokumen konsisten, offline).
- Minimum QA untuk setiap feature: ujian manual senarai semak (mobile + desktop, offline mode, print/PDF).
- Perubahan yang menambah kebergantungan backend MUST dicadangkan sebagai fasa berasingan dan
  melibatkan bump versi MAJOR/MINOR mengikut impak.

## Governance

- Constitution ini adalah sumber utama untuk prinsip pembangunan dan mengatasi dokumen lain jika konflik.
- Pindaan MUST dibuat melalui perubahan bertulis pada fail ini dan disemak bersama impak kepada templat
  `.specify/templates/*` dan spesifikasi feature.
- Versioning policy (SemVer):
  - **MAJOR**: Menukar/menarik balik prinsip teras atau menambah keperluan yang memecahkan workflow.
  - **MINOR**: Menambah prinsip/sekatan baru yang tidak memecahkan yang sedia ada.
  - **PATCH**: Klarifikasi, pembaikan bahasa, atau tambahan kecil tanpa perubahan maksud.
- Review expectation: setiap `plan.md`/`spec.md` MUST menyatakan pematuhan (atau pelanggaran + justifikasi).

**Version**: 1.0.0 | **Ratified**: 2025-12-22 | **Last Amended**: 2025-12-22
