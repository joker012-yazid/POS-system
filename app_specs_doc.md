# KedaiServis Suite (Web-Based)
Dokumen R&D + Cadangan Sistem + Pelan Pembangunan  
Status: Draf (boleh edit ikut keperluan)

---

## 0) Ringkasan Projek
**KedaiServis Suite** ialah sistem web untuk kedai servis komputer (format laptop/desktop, servis habuk, pemasangan software, troubleshooting, pembaikan asas) dan juga jualan barang (aksesori/komponen) walaupun kuantiti kecil.

Matlamat utama:
- Mudahkan urusan **Quotation → Invoice → Receipt**
- Rekod dan jejak **job servis** dengan kemas (status, kos, tugasan)
- Simpan rekod **pelanggan + peranti + sejarah servis**
- Rekod **bayaran tunai & online**
- Multi-user dengan **2 role sahaja: Admin dan User**
- UI moden, pantas, responsif, dan ada elemen **immersive experience**

---

## 1) Objektif & Skop

### 1.1 Objektif
1. Menjadikan proses jual beli & servis **lebih cepat, kemas, dan standard**.
2. Mengurangkan kesilapan manual (kira harga, tulis resit, rekod hilang).
3. Membolehkan staf bekerja seragam dengan template, flow, dan validation.

### 1.2 Skop MVP (wajib ada)
- Login (Admin/User)
- Customer + Device profile
- Job servis (ticket) + status + task checklist
- Quotation + Invoice + Receipt (PDF + print)
- Rekod pembayaran: Tunai / Online (manual reference)
- Produk + stok asas (optional dalam MVP, tetapi disarankan siap awal)
- Laporan ringkas (harian/bulanan): jualan, servis, untung kasar anggaran
- Audit trail asas (siapa buat apa)

### 1.3 Skop Future (boleh tambah kemudian)
- Payment gateway sebenar (FPX/eWallet/card)
- Ansuran (installment plan) + jadual pembayaran + peringatan
- WhatsApp/SMS notifikasi status job
- Barcode/QR scanning untuk resit/invoice & stok
- Multi-cawangan (branch) + staff mengikut branch
- CRM ringan (tag pelanggan, broadcast promo)
- Approval flow (admin approve quotation sebelum buat kerja)

---

## 2) Role & Permission (2 Role Sahaja)

### 2.1 Admin
- Full access: setting sistem, template dokumen, user management, report semua
- Boleh edit harga, stok, delete record (jika dibenarkan), refund/cancel

### 2.2 User (Staff)
- Boleh create job, create quotation/invoice/receipt, update status job
- Boleh create customer & device
- Tidak boleh ubah setting kritikal dan tidak boleh delete record sensitif (default)

### 2.3 Matrix Permission (cadangan)
| Modul | Admin | User |
|------|------:|-----:|
| Dashboard | ✅ | ✅ |
| Customers/Devices | ✅ | ✅ |
| Jobs/Tasks | ✅ | ✅ |
| Quotation/Invoice/Receipt | ✅ | ✅ (limit cancel/delete) |
| Payments | ✅ | ✅ (limit refund) |
| Products/Inventory | ✅ | ✅ (limit adjust stock) |
| Reports | ✅ | ✅ (report ringkas sahaja) |
| Settings/Templates | ✅ | ❌ |
| Users & Roles | ✅ | ❌ |
| Audit Log | ✅ | ❌ |

---

## 3) Modul Sistem (Cadangan Struktur)

### 3.1 Dashboard (Home)
- Kad ringkas: “Jobs Today”, “Unpaid Invoices”, “Pending Quotation Approval”, “Low Stock”
- Quick actions: `+ Job`, `+ Quotation`, `+ Invoice`, `+ Receipt`
- Search global (nama pelanggan / no phone / serial device / invoice no)

### 3.2 Customer & Device
**Customer**
- Nama, phone, email (optional), alamat (optional)
- Tag pelanggan: “Regular”, “Corporate”, “Student” (optional)

**Device**
- Jenis: laptop/desktop/others
- Brand/Model, Serial Number, Password (optional & sensitif), Accessories received
- Isu/complaint pelanggan (initial complaint)

### 3.3 Job Servis (Ticket)
- Job ID automatik (contoh: `JS-2025-000123`)
- Status: `Received` → `Diagnose` → `Quoted` → `In Progress` → `Ready` → `Collected/Closed`
- Assign staff (user)
- Task checklist (contoh: backup, format, driver, testing, cleaning)
- Parts/Item used (optional)
- Kos buruh + kos parts + diskaun + tax (optional)
- Note internal (staf) vs note pelanggan

### 3.4 Dokumen Transaksi
**Quotation**
- Dari job (recommended) atau standalone
- Item/service list
- Validity date
- Approval: “Accepted/Rejected/Expired”

**Invoice**
- Dari quotation yang accepted atau direct
- Due date
- Status: `Unpaid`, `Partially Paid`, `Paid`, `Cancelled`

**Receipt**
- Auto generate bila payment completed
- Boleh print A4 / thermal (58mm/80mm) ikut template

### 3.5 Payments
- Payment method: `Cash` / `Online`
- Online: simpan `reference number`, bank/eWallet, bukti (upload optional)
- Partial payment supported (important untuk future ansuran juga)

### 3.6 Products & Inventory (ringan tetapi sangat berguna)
- Product: nama, SKU, cost, price, stock qty, min stock
- Stock movement log (masuk/keluar/adjust)
- Linking item sold to invoice

### 3.7 Reports (MVP)
- Sales summary (daily/monthly)
- Service revenue summary
- Top services / top products
- Outstanding invoices (unpaid)

### 3.8 Settings
- Company profile: nama kedai, alamat, phone, logo
- Document numbering format
- Template invoice/receipt
- Tax/discount rules (optional)
- Role policy (simple toggle)

---

## 4) Flow Operasi Kedai (Recommended)

### 4.1 Flow Servis (end-to-end)
1. **Customer datang** → create customer (jika baru)
2. Register **device** + complaint + accessories
3. Create **Job** (Received)
4. Diagnose → update job status + item diagnosis
5. Buat **Quotation** → customer approve
6. Convert quotation → **Invoice**
7. Buat kerja (In Progress) + checklist tasks
8. Ready → customer bayar
9. Rekod payment (cash/online) → auto generate **Receipt**
10. Close job (Collected/Closed) + simpan history

### 4.2 Flow Jual Barang (simple)
1. Pilih customer (optional)
2. Create invoice → add products
3. Payment → receipt

---

## 5) Data Model (High-Level)
Entiti utama (cadangan):
- `User` (Admin/User)
- `Customer`
- `Device`
- `Job`
- `JobTask` (checklist)
- `Product`
- `StockMovement`
- `Quotation`
- `Invoice`
- `InvoiceItem` (service/product)
- `Payment`
- `Receipt`
- `AuditLog` (optional MVP, recommended)

---

## 6) Immersive Experience (UI/UX Cadangan)
Tujuan: UI nampak moden, “sedap guna”, cepat, dan kurang stres untuk staf.

### 6.1 Prinsip UX
- **One-screen, one-task**: bila buat job, fokus job
- **Fast entry**: form ringkas, auto-suggest, default value
- **Search everywhere**: search global sentiasa ada
- **Zero confusion**: status job jelas + timeline progress

### 6.2 Elemen Immersive yang praktikal
1. **Progress Timeline untuk Job**
   - Visual stepper: Received → Diagnose → Quoted → In Progress → Ready → Closed
2. **Micro-interactions**
   - Animasi ringan bila save, badge berubah status, toast success/error
3. **Smart Quick Actions**
   - Floating action button di mobile: `+ Job / + Invoice`
4. **Command Palette (optional)**
   - Tekan `/` untuk cari customer, invoice, job cepat (desktop)
5. **Dark Mode + High Contrast Mode**
   - Untuk kerja lama/siang malam
6. **PWA Ready**
   - “Install app” dari browser untuk staff guna macam app
7. **Printable Templates**
   - A4 + Thermal mode, dengan preview sebelum print
8. **Dashboard Visual**
   - Grafik ringkas (revenue, job count) + “alerts” (low stock, unpaid)

### 6.3 Style Guide (boleh ubah)
- Typography: jelas, besar sikit untuk mobile
- Spacing: besar, “breathing room”
- Cards: modul dalam bentuk kad supaya mudah imbas
- Iconography: konsisten (servis, invoice, payment, customer)

---

## 7) Cadangan Tech Stack & Tooling

> Anda pernah buat projek sebelum ini (Node/Next/Prisma ekosistem sangat sesuai). Untuk projek baru ini, saya cadangkan stack yang “laju develop”, maintainable, dan mudah tambah feature.

### Option A (Recommended): Fullstack Modern (Next.js)
- Frontend: **Next.js (App Router) + React**
- UI: **TailwindCSS + shadcn/ui**
- Auth: **NextAuth** atau **Lucia Auth**
- DB: **PostgreSQL**
- ORM: **Prisma**
- PDF: server-side generate (contoh: `pdf-lib` / `puppeteer` template HTML-to-PDF)
- Cache/Jobs (future): **Redis + BullMQ**
- Deployment: **Docker Compose + Nginx** (VPS)

Kelebihan:
- UI immersive senang buat (components, animation)
- Cepat develop, mudah scale
- Banyak pilihan library untuk invoice/print

### Option B: Laravel (stabil, cepat siap)
- Backend: **Laravel**
- Frontend: Blade / Inertia + Vue/React
- DB: MySQL/Postgres
Kelebihan:
- Auth, policy, role, migration—semua matang

### Option C: Django (kemas & enterprise-friendly)
- Backend: Django + DRF
- Frontend: React/Vue
Kelebihan:
- Admin panel kuat, sesuai untuk data-heavy

**Keputusan cadangan:** Option A (Next.js) untuk UI immersive dan future upgrade yang mudah.

---

## 8) Struktur Projek (Cadangan)
Jika Option A (Next.js), struktur ringkas:
- `/app` (routes: dashboard, jobs, customers, invoices, products, settings)
- `/components` (ui components)
- `/lib` (utils, db, auth, pdf)
- `/prisma` (schema)
- `/public` (logo, assets)
- `/docs` (dokumen projek)
- `/tests` (optional)

---

## 9) MVP Milestone (Cadangan Fasa)
### Phase 1 — Core Workflow (Paling penting)
- Auth + roles
- Customer + Device
- Job + status + tasks checklist
- Quotation + Invoice + Receipt (basic PDF)
- Payments (cash/online manual)

### Phase 2 — Inventory + Reports
- Products + StockMovement
- Basic reports + dashboard cards
- Print thermal + template setting

### Phase 3 — Immersive & Automation
- PWA install + offline cache (limited)
- Notifikasi (WhatsApp/SMS) (optional)
- Payment gateway sebenar (optional)

### Phase 4 — Advanced
- Ansuran + jadual bayar + reminder
- Multi-branch
- CRM mini + broadcast

---

## 10) Acceptance Criteria (Ringkas tetapi jelas)
Sistem dianggap “boleh guna” bila:
- Admin boleh create user, login, set template dokumen
- User boleh create job, update status, buat quotation, convert ke invoice
- User boleh rekod payment cash/online dan generate receipt
- Dokumen boleh print dan nampak professional (logo, nombor dokumen, tarikh, total)
- Search global boleh cari by phone / nama / job id / invoice id
- UI responsif: phone & laptop smooth

---

## 11) Security & Data Handling (Wajib jaga)
- Password hashing + session secure
- Role enforcement di server (bukan UI sahaja)
- Audit log untuk tindakan penting (cancel invoice, adjust stock)
- Backup DB harian (minimum)
- Data sensitif (password device) disimpan encrypted atau optional sahaja

---

## 12) Senarai “Nice-to-Have” (Tambah Nilai Cepat)
- Auto price suggestion untuk servis biasa (Format Windows, Cleaning, etc.)
- Template servis “1-click job” (isi cepat)
- Upload gambar (before/after) untuk job
- Warranty/claim tracker (tempoh waranti servis)
- Tag & filter: “urgent”, “VIP”, “waiting parts”
- Export CSV untuk report bulanan

---

## 13) Nama Modul & Screen List (Untuk rujukan UI)
- `/login`
- `/dashboard`
- `/customers` + `/customers/:id`
- `/devices/:id`
- `/jobs` + `/jobs/:id`
- `/quotations` + `/quotations/:id`
- `/invoices` + `/invoices/:id`
- `/receipts` + `/receipts/:id`
- `/products`
- `/reports`
- `/settings` (admin only)
- `/users` (admin only)

---

## 14) Next Step (Praktikal)
1. Pilih stack (cadangan: Option A Next.js)
2. Sahkan format dokumen:
   - Header (logo + alamat)
   - Nombor dokumen
   - Layout thermal vs A4
3. Senarai servis standard kedai (pricing baseline)
4. Mula bina MVP ikut Phase 1