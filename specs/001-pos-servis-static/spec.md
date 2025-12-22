# Feature Specification: POS + Servis Kedai Komputer (Static Web MVP)

**Feature Branch**: `001-pos-servis-static`  
**Created**: 2025-12-22  
**Status**: Draft  
**Input**: Aplikasi web statik untuk pengurusan jual beli & servis kedai komputer berasaskan templat +
rujukan PDF (job servis, quotation/invoice/receipt, pembayaran tunai/online, pelanggan/peranti, stok, laporan).

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Job Servis (Ticket) + Status (Priority: P1)

Sebagai staff, saya mahu daftar pelanggan dan peranti, kemudian cipta job servis (ticket) dengan status
supaya saya boleh jejak kerja dari diterima sampai siap/closed dengan kemas.

**Why this priority**: Ini aliran kerja teras untuk kedai servis; tanpa job tracking, operasi jadi bercampur dan
mudah tertinggal.

**Independent Test**: Boleh diuji sepenuhnya dengan cipta 1 pelanggan + 1 peranti + 1 job, kemudian
kemaskini status dan semak ia kekal selepas refresh/offline.

**Acceptance Scenarios**:

1. **Given** tiada rekod, **When** staff cipta pelanggan, peranti, dan job servis, **Then** job menerima ID unik
   dan dipaparkan dalam senarai job.
2. **Given** job wujud, **When** staff ubah status (Received → Diagnose → In Progress → Ready → Closed),
   **Then** status terkini dan sejarah perubahan direkodkan bersama masa dan pengguna.

---

### User Story 2 - Sebutharga (Quotation) Profesional (Priority: P1)

Sebagai staff, saya mahu hasilkan sebutharga (quotation) dari job servis atau secara standalone, supaya
saya boleh beri anggaran harga kepada pelanggan dengan format yang kemas dan konsisten.

**Why this priority**: Quotation mempercepatkan persetujuan pelanggan dan mengurangkan salah kira harga.

**Independent Test**: Cipta quotation dengan beberapa item/servis, jana paparan print/PDF, kemudian
set status Accepted/Rejected dan semak ia tersimpan.

**Acceptance Scenarios**:

1. **Given** job servis wujud, **When** staff jana quotation daripada job, **Then** maklumat pelanggan/peranti
   diisi automatik dan staff boleh tambah item/servis sebelum simpan.
2. **Given** quotation wujud, **When** staff jana print/PDF, **Then** dokumen mengandungi nombor dokumen
   unik, butiran kedai, senarai item/servis, dan jumlah yang betul.

---

### User Story 3 - Invois, Pembayaran (Tunai/Online), dan Resit (Priority: P1)

Sebagai staff, saya mahu hasilkan invois (daripada quotation accepted atau standalone), rekod bayaran
tunai/online (termasuk partial payment), dan jana resit bila bayaran selesai.

**Why this priority**: Ini menutup kitaran jual beli: invois → bayaran → resit; penting untuk rekod kewangan.

**Independent Test**: Cipta 1 invoice, rekod 2 bayaran (partial + final), semak baki, status invoice, dan resit
boleh dicetak/dijana semula.

**Acceptance Scenarios**:

1. **Given** invoice berstatus Unpaid, **When** staff rekod bayaran separa, **Then** status jadi Partially Paid
   dan baki tertunggak dikira dengan betul.
2. **Given** invoice mempunyai baki, **When** staff rekod bayaran akhir, **Then** status jadi Paid dan resit
   dijana (atau tersedia untuk dijana) dengan rujukan pembayaran.

---

### User Story 4 - Produk & Inventori Asas (Priority: P2)

Sebagai admin/staff, saya mahu simpan senarai produk, stok, dan amaran stok rendah supaya jualan barang
dan penggunaan parts untuk servis boleh direkodkan dengan lebih tersusun.

**Why this priority**: Inventori membantu kurangkan kehabisan stok dan memudahkan anggaran untung kasar.

**Independent Test**: Cipta produk, buat pelarasan stok, semak log pergerakan stok, dan lihat amaran stok
rendah apabila kuantiti jatuh bawah minimum.

**Acceptance Scenarios**:

1. **Given** produk wujud dengan `min stock`, **When** stok dikurangkan hingga bawah minimum,
   **Then** sistem memaparkan amaran stok rendah pada dashboard/produk.
2. **Given** invoice mempunyai item produk, **When** invoice ditandakan Paid, **Then** stok berkurang
   mengikut kuantiti yang dijual dan pergerakan stok direkodkan.

---

### User Story 5 - Backup/Restore Data + Audit Trail (Priority: P2)

Sebagai admin, saya mahu boleh export/import data dan melihat audit trail tindakan penting supaya sistem
statik (local-only) tetap selamat dari segi operasi (backup) dan mudah diaudit.

**Why this priority**: Tanpa backend, backup/restore ialah “nyawa” data; audit trail pula penting untuk kesilapan
dan semakan.

**Independent Test**: Isi beberapa rekod, export ke fail, clear data, import semula, dan semak bilangan serta
hubungan data kekal; audit log menunjukkan tindakan.

**Acceptance Scenarios**:

1. **Given** data wujud, **When** admin export, **Then** satu fail backup terhasil dan boleh dimuat turun.
2. **Given** admin import fail backup, **When** admin sahkan tindakan import, **Then** data dipulihkan dan
   sistem boleh digunakan semula tanpa ralat.

---

### User Story 6 - Dashboard + Laporan Ringkas (Priority: P3)

Sebagai admin, saya mahu dashboard dan laporan ringkas (harian/bulanan) supaya saya nampak ringkasan
jualan, hasil servis, invoice tertunggak, dan status kerja tanpa kira manual.

**Why this priority**: Memberi gambaran pantas prestasi kedai dan memudahkan keputusan operasi.

**Independent Test**: Dengan data contoh, buka dashboard/laporan dan bandingkan jumlah kiraan dengan
rekod dokumen yang ada.

**Acceptance Scenarios**:

1. **Given** terdapat invoice dan pembayaran, **When** admin lihat laporan harian/bulanan, **Then** jumlah
   jualan/hasil servis dan bilangan transaksi dipaparkan dengan tepat.
2. **Given** terdapat job dan stok rendah, **When** admin buka dashboard, **Then** kad ringkas memaparkan
   “jobs today”, “unpaid invoices”, dan “low stock”.

---

### Edge Cases

- Import fail (fail format/korup): sistem menunjukkan ralat yang jelas dan tidak mengubah data sedia ada.
- Import overwrite: sistem wajib minta pengesahan jelas sebelum menggantikan data sedia ada.
- Storage penuh / quota browser: sistem memaklumkan pengguna dan mengelakkan simpanan separa.
- Offline semasa operasi: pengguna masih boleh buat operasi teras dan diberi indikator offline.
- Nombor dokumen bertindih selepas import: sistem mengesan konflik dan menghalang simpan/menjana nombor
  yang duplicate.
- Partial payment melebihi jumlah invoice: sistem menolak input dan meminta pembetulan.
- Invoice dibatalkan selepas ada bayaran: sistem memerlukan sebab pembatalan dan pengendalian baki (cth.
  refund/void) direkodkan dalam audit trail.
- Data sensitif (password peranti) terisi: sistem tidak memaparkan dalam dokumen print/PDF dan boleh dipadam.
- Carian tidak jumpa hasil: sistem memaparkan “no results” dan cadangan tindakan (cth. cipta pelanggan/job).
- Peranti tanpa serial number: sistem membenarkan tetapi menggalakkan pengisian untuk jejak yang lebih baik.

## Requirements *(mandatory)*

### Functional Requirements

#### Static Web, Offline, dan Data Tempatan

- **FR-001**: Sistem MUST boleh digunakan sebagai aplikasi web statik dalam pelayar tanpa backend untuk fungsi teras.
- **FR-002**: Sistem MUST menyimpan semua data operasi di peranti secara tempatan dan kekal selepas tutup browser.
- **FR-003**: Sistem MUST boleh berfungsi offline untuk aliran kerja P1 (job, quotation, invoice, payment, receipt) selepas
  akses pertama.
- **FR-004**: Sistem MUST menyediakan fungsi export data (backup) ke satu fail yang boleh dimuat turun.
- **FR-005**: Sistem MUST menyediakan fungsi import data (restore) daripada fail backup dengan pengesahan sebelum
  overwrite data sedia ada.
- **FR-006**: Sistem MUST menyediakan tindakan “clear all local data” dengan amaran dan pengesahan berganda.

#### Pengguna & Peranan (Admin/User) - Local-Only

- **FR-007**: Sistem MUST menyokong login untuk dua peranan: Admin dan User (staff) bagi kawalan akses di peranti yang sama.
- **FR-008**: Admin MUST boleh mencipta, mengemaskini, menyahaktif, dan reset kelayakan pengguna tempatan.
- **FR-009**: Sistem MUST merekod pengguna yang melakukan tindakan penting (create/update/cancel) pada job, dokumen,
  pembayaran, pelarasan stok, import/clear data, dan pengurusan pengguna.

#### Pelanggan & Peranti

- **FR-010**: Sistem MUST membenarkan cipta/kemaskini pelanggan (nama, telefon; emel/alamat optional).
- **FR-011**: Sistem MUST menyediakan carian pantas pelanggan berdasarkan nama atau nombor telefon.
- **FR-012**: Sistem MUST membenarkan cipta/kemaskini peranti yang dipautkan kepada pelanggan (jenis, brand/model,
  serial number optional, aksesori diterima, isu/complaint).
- **FR-013**: Jika “password peranti” digunakan, ia MUST opt-in, dipaparkan masked, dan tidak dimasukkan ke dokumen print/PDF.

#### Job Servis (Ticket)

- **FR-014**: Sistem MUST membenarkan cipta job servis dengan ID unik automatik (default contoh: `JS-YYYY-######`).
- **FR-015**: Job MUST menyokong status workflow sekurang-kurangnya: `Received`, `Diagnose`, `Quoted`, `In Progress`,
  `Ready`, `Collected/Closed`.
- **FR-016**: Sistem MUST membenarkan job di-assign kepada staff dan boleh diubah bila perlu.
- **FR-017**: Sistem MUST menyokong task checklist per job (tambah, tanda siap, susun).
- **FR-018**: Sistem MUST menyokong nota internal (staff) dan nota untuk pelanggan secara berasingan.
- **FR-019**: Sistem MUST menyimpan sejarah perubahan status dan perubahan penting job untuk rujukan/audit.

#### Dokumen Transaksi: Quotation, Invoice, Receipt

- **FR-020**: Sistem MUST membenarkan quotation dicipta secara standalone atau dipautkan kepada job.
- **FR-021**: Quotation MUST menyokong senarai item/servis (penerangan, kuantiti, harga seunit, jumlah baris) dan jumlah akhir.
- **FR-022**: Quotation MUST mempunyai tarikh dan (optional) tarikh luput/validity, serta status `Accepted/Rejected/Expired`.
- **FR-023**: Sistem MUST membenarkan invoice dicipta daripada quotation berstatus Accepted atau secara standalone.
- **FR-024**: Invoice MUST mempunyai status `Unpaid`, `Partially Paid`, `Paid`, `Cancelled` dan (optional) due date.
- **FR-025**: Sistem MUST membenarkan rekod pembayaran dikaitkan kepada invoice dan mengira baki secara automatik.
- **FR-026**: Sistem MUST menjana receipt apabila invoice menjadi `Paid`, dan receipt boleh dijana/diakses semula untuk reprint.
- **FR-027**: Semua dokumen MUST mempunyai nombor dokumen unik (default contoh: `QT-YYYY-######`, `INV-YYYY-######`,
  `RC-YYYY-######`) dan mengelakkan pertindihan selepas import.
- **FR-028**: Dokumen MUST memaparkan profil kedai (nama, alamat, telefon, logo optional) dan ringkasan jumlah yang konsisten.
- **FR-029**: Sistem MUST menyediakan paparan print-ready dan eksport PDF untuk quotation/invoice/receipt (A4 wajib).
- **FR-030**: Sistem SHOULD menyokong mod print thermal (58mm/80mm) menggunakan templat berasingan.

#### Pembayaran (Tunai & Online)

- **FR-031**: Sistem MUST menyokong kaedah pembayaran `Cash` dan `Online` untuk setiap invoice.
- **FR-032**: Untuk `Online`, sistem MUST menyimpan rujukan transaksi (reference number) dan label bank/eWallet (optional).
- **FR-033**: Sistem MUST menyokong partial payment (lebih dari satu payment untuk invoice yang sama).
- **FR-034**: Sistem MUST menghalang bayaran melebihi jumlah invoice (kecuali flow refund yang ditakrifkan oleh admin).
- **FR-035**: Admin MUST boleh membatalkan invoice dengan sebab pembatalan; pembatalan tidak boleh memadam rekod asal.

#### Produk & Inventori Asas

- **FR-036**: Sistem MUST membenarkan cipta/kemaskini produk (nama, SKU optional, kos, harga jualan, kuantiti stok, minimum stok).
- **FR-037**: Sistem MUST merekod pergerakan stok (masuk/keluar/adjust) bersama sebab dan pengguna.
- **FR-038**: Sistem MUST memaparkan amaran stok rendah apabila kuantiti <= minimum stok.
- **FR-039**: Jika produk digunakan dalam invoice, sistem SHOULD menolak stok secara automatik apabila invoice `Paid`.

#### Dashboard, Laporan, dan Carian

- **FR-040**: Sistem SHOULD menyediakan dashboard dengan kad ringkas: jobs hari ini, unpaid invoices, low stock.
- **FR-041**: Sistem MUST menyediakan laporan ringkas harian/bulanan sekurang-kurangnya untuk jumlah jualan dan invoice tertunggak.
- **FR-042**: Sistem MUST menyediakan carian global untuk pelanggan (nama/telefon), peranti (serial), job ID, dan nombor dokumen.

#### Audit Trail & Integriti Operasi

- **FR-043**: Sistem MUST menyimpan audit trail untuk tindakan kritikal: cancel invoice, rekod payment, pelarasan stok,
  pengurusan pengguna, import/clear data, dan perubahan status job.
- **FR-044**: Sistem MUST melakukan validasi input asas (cth. kuantiti >= 0, harga >= 0, payment > 0) dan memberi mesej ralat yang jelas.

### Key Entities *(include if feature involves data)*

- **User**: Akaun pengguna tempatan (nama, peranan Admin/User, status aktif), digunakan untuk login dan audit.
- **Customer**: Pelanggan (nama, telefon, emel/alamat optional, tag optional).
- **Device**: Peranti pelanggan (jenis, brand/model, serial optional, aksesori, isu/complaint, password opt-in).
- **Job**: Ticket servis (job no, status, assigned staff, task checklist, kos/nota, timestamps, history).
- **JobTask**: Item checklist untuk job (tajuk, status siap, susunan).
- **Document**: Rekod dokumen transaksi (Quotation/Invoice/Receipt) dengan nombor unik, status, tarikh, pautan ke job/customer.
- **LineItem**: Baris item/servis dalam dokumen (penerangan, kuantiti, harga, jumlah).
- **Payment**: Rekod bayaran untuk invoice (method, amount, reference online, tarikh, penerima).
- **Product**: Produk/parts (nama, SKU optional, cost, price, stock qty, min stock).
- **StockMovement**: Log pergerakan stok (jenis, delta, sebab, pengguna, tarikh, pautan optional ke invoice).
- **CompanyProfile/Settings**: Maklumat kedai + tetapan penomboran dokumen + templat dokumen/print.
- **AuditEvent**: Log tindakan penting (aksi, entiti, pengguna, masa, ringkasan perubahan).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Staff boleh cipta pelanggan + peranti + job servis dalam ≤ 2 minit tanpa bantuan.
- **SC-002**: Staff boleh cipta quotation dan jana paparan print/PDF dalam ≤ 1 minit untuk transaksi standard.
- **SC-003**: Staff boleh rekod bayaran (cash/online) dan keluarkan resit dalam ≤ 30 saat untuk invoice standard.
- **SC-004**: Selepas akses pertama, aliran kerja P1 kekal boleh digunakan walaupun internet terputus.
- **SC-005**: Carian global memaparkan hasil yang relevan dalam ≤ 1 saat untuk dataset kecil-kedai (ribuan rekod).
- **SC-006**: Nombor job dan nombor dokumen kekal unik dalam dataset (tiada duplicate selepas import).
- **SC-007**: Proses export → clear data → import memulihkan semula rekod tanpa kehilangan hubungan data (customer↔device↔job↔dokumen).
- **SC-008**: Sekurang-kurangnya 90% pengguna baru (staff) boleh lengkapkan aliran kerja “job → invoice → payment → receipt”
  pada cubaan pertama.
- **SC-009**: Dokumen print/PDF memaparkan branding kedai dan jumlah kiraan yang sepadan dengan data sistem.
- **SC-010**: Secara default, sistem tidak menyimpan data sensitif yang tidak diperlukan (cth. password peranti).

## Assumptions

- Sistem ini adalah **static web** dan digunakan terutama pada **satu peranti / satu browser profile**; penggunaan multi-peranti
  memerlukan export/import.
- Mata wang default: **MYR**; cukai default **0** kecuali diaktifkan dalam tetapan.
- Integrasi payment gateway sebenar, WhatsApp/SMS automasi, ansuran, dan cloud sync adalah fasa upgrade (bukan skop MVP statik).
