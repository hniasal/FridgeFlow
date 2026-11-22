# FridgeFlow — Manajemen Inventaris Dapur & Otomatisasi Stok Resep

> **Catat bahan baku dapur, cek kecukupan resep otomatis, dan kendalikan transaksi stok masuk/keluar dalam satu alur kerja.**

Aplikasi web manajemen inventaris bahan baku dapur untuk rumah tangga maupun UMKM kuliner. FridgeFlow membantu pengguna memantau stok dan tanggal kedaluwarsa bahan baku, mengecek kecukupan bahan untuk setiap resep secara otomatis sebelum produksi, mencatat setiap pergerakan stok masuk dan keluar, serta menyediakan asisten ide menu sebagai fitur pendukung untuk memaksimalkan bahan yang tersedia.

---

## Daftar Isi

- [Latar Belakang](#latar-belakang)
- [Solusi & Keunggulan](#solusi--keunggulan-usp)
- [Fitur Utama](#fitur-utama)
- [Cuplikan Layar](#cuplikan-layar)
- [Arsitektur & Cara Kerja](#arsitektur--cara-kerja)
- [Teknologi](#teknologi)
- [Cakupan Data & Aturan Inventaris](#cakupan-data--aturan-inventaris)
- [Privasi & Keamanan](#privasi--keamanan)
- [Menjalankan Secara Lokal](#menjalankan-secara-lokal)
- [Variabel Lingkungan](#variabel-lingkungan)
- [Deploy](#deploy)
- [Struktur Proyek](#struktur-proyek)
- [Aksesibilitas & Performa](#aksesibilitas--performa)
- [Batasan & Rencana Lanjutan](#batasan--rencana-lanjutan)
- [Kredit & Sumber](#kredit--sumber)

---

## Latar Belakang

Pengelolaan bahan baku pada dapur rumah tangga maupun usaha kuliner skala kecil dan menengah sering terkendala oleh pencatatan yang terpisah antara daftar belanja, buku resep, dan pemakaian harian:

| Permasalahan Dapur                         | Dampak Operasional                                                                   |
| ------------------------------------------ | ------------------------------------------------------------------------------------ |
| **Bahan melewati tanggal kedaluwarsa**     | Pemborosan biaya belanja akibat bahan yang tersimpan tidak terpantau masa simpannya. |
| **Kekurangan bahan saat mulai memasak**    | Proses produksi atau masak harian terhambat karena stok tidak dicek sebelum mulai.   |
| **Selisih catatan stok fisik dan catatan** | Pemotongan stok secara manual sering terlewat setelah resep diproduksi.              |

FridgeFlow menjawab masalah tersebut dengan menyatukan pencatatan inventaris bahan baku, daftar resep, pengecekan kecukupan bahan otomatis, serta riwayat transaksi stok ke dalam satu sistem yang saling terhubung.

## Solusi & Keunggulan

FridgeFlow menjalankan pengelolaan dapur dalam satu siklus tertutup yang otomatis memperbarui saldo stok setiap kali terjadi penambahan barang maupun produksi resep:

```
   ┌──────────────────┐        ┌──────────────────┐        ┌──────────────────┐
   │  1. INVENTARIS   │  ───▶  │  2. BUKU RESEP   │  ───▶  │   3. PRODUKSI    │
   │ catat stok, min  │        │ takaran resep &  │        │ cek kecukupan &  │
   │ stok & expired   │        │ cek kecukupan    │        │ potong stok -    │
   └──────────────────┘        └──────────────────┘        └──────────────────┘
            ▲                                                       │
            └─────────── audit transaksi stok IN / OUT ─────────────┘
```

Keunggulan utama yang diterapkan:

- **Pengecekan Kecukupan Resep Otomatis** — sistem langsung membandingkan takaran tiap bahan pada resep dengan saldo stok aktual di gudang, menampilkan status kecukupan serta selisih kekurangan bahan secara instan.
- **Pemotongan Stok Transaksional Saat Produksi** — saat produksi dijalankan untuk sejumlah porsi/pcs tertentu, sistem memvalidasi seluruh bahan lalu memotong stok dan mencatat transaksi keluar secara atomik.
- **Pencatatan Transaksi Masuk & Keluar Otomatis** — setiap input stok awal, restock, penyesuaian stok manual, maupun produksi resep otomatis terekam sebagai log audit `IN` dan `OUT`.
- **Auto-Linking Bahan Resep** — resep tetap bisa disimpan meski sebagian bahannya belum dibeli; begitu bahan tersebut ditambahkan ke Inventaris dengan nama yang sama, sistem otomatis menghubungkannya ke resep terkait.

## Fitur Utama

| Area                                  | Ringkasan                                                                                                                                                                                                      |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Inventaris Bahan Baku**             | Pengelolaan stok per kategori dengan validasi satuan diskrit dan kontinu, batas **Stok Minimum** bilangan bulat, indikator peringatan kedaluwarsa (`H-5` s.d. `Kedaluwarsa`), serta tombol **Restock** cepat.  |
| **Buku Resep & Arsip**                | Penyusunan standar takaran 1 resep (dari stok gudang maupun bahan tambahan di luar stok), editor catatan langkah pembuatan, tampilan detail resep, serta fitur **Arsipkan / Pulihkan Resep**.                  |
| **Produksi & Cek Kecukupan Resep**    | Perhitungan otomatis kebutuhan bahan untuk $N$ porsi/pcs. Sistem menandai resep yang siap dibuat, menolak produksi jika stok kurang beserta rincian kekurangannya, dan memotong stok otomatis saat dieksekusi. |
| **Riwayat Transaksi Stok**            | Pencatatan otomatis seluruh pergerakan barang masuk (`IN`: stok awal, restock, penyesuaian tambah) dan keluar (`OUT`: produksi resep, penyesuaian kurang) untuk memudahkan audit dapur.                        |
| **Dashboard Ringkasan Dapur**         | Pemantauan cepat bahan yang mendekati atau melewati tanggal kedaluwarsa, daftar bahan di bawah batas minimum stok, serta jumlah resep aktif yang siap diproduksi.                                              |
| **Asisten Ide Menu (Fitur Tambahan)** | Fitur pendukung untuk membantu mencari inspirasi resep dari bahan yang tersedia di dapur maupun permintaan menu tertentu, lengkap dengan penanda status ketersediaan tiap bahan.                               |

Fitur pendukung lainnya: dialog konfirmasi dan notifikasi aksesibel berbasis **Radix UI**, pencarian dan filter kategori di setiap halaman utama, serta validasi input berlapis di frontend dan backend.

## Cuplikan Layar

Alur kerja utama yang dapat langsung dicoba setelah masuk ke aplikasi:

1. **Catat Bahan Baku:** Buka menu **Bahan Baku**, lalu tambahkan stok bahan dapur lengkap dengan satuan, batas stok minimum, dan tanggal kedaluwarsa.
2. **Susun Resep & Cek Kecukupan:** Buka **Buku Resep** untuk membuat resep baru; sistem otomatis mengecek apakah stok bahan di inventaris sudah mencukupi untuk membuat resep tersebut.
3. **Jalankan Produksi:** Masuk ke menu **Produksi**, tentukan jumlah porsi/pcs yang akan dibuat, lalu konfirmasi produksi agar stok seluruh bahan terpotong otomatis.
4. **Pantau Riwayat & Ide Menu:** Periksa log keluar-masuk bahan di **Riwayat Transaksi**, atau gunakan **Asisten Ide Menu** sebagai fitur tambahan saat membutuhkan inspirasi olahan bahan dapur.

## Arsitektur & Cara Kerja

Aplikasi dibangun dengan arsitektur **client–server terpisah** menggunakan frontend Next.js dan REST API Express yang terhubung ke database PostgreSQL di Supabase.

### Aliran Data & Transaksi Stok Atomik

```
Browser (Next.js + React)
      │
      └── Bearer JWT ──▶ Express REST API (/api/*)
                               │
                               ├── Joi Validation & Aturan Satuan
                               ├── PostgreSQL / Supabase (SSL Pooler)
                               └── Layanan Ide Menu (fitur tambahan server-side)
```

Seluruh operasi yang memengaruhi jumlah stok (`createIngredient`, `updateIngredient`, `restockIngredient`, dan `checkoutRecipe`) dijalankan di dalam blok transaksi SQL (`BEGIN` / `COMMIT` / `ROLLBACK`). Jika salah satu bahan pada resep tidak mencukupi saat produksi, seluruh transaksi dibatalkan otomatis sehingga tidak pernah terjadi pemotongan stok sebagian.

### Cara Kerja Pengecekan Kecukupan Resep

Saat daftar resep diambil melalui `GET /api/recipes`, backend menggabungkan tabel `recipe_ingredients` dengan `ingredients` milik pengguna untuk menghitung secara otomatis:

- **`stock_available`**: jumlah stok bahan saat ini di inventaris.
- **`is_enough`**: bernilai `true` apabila bahan terdaftar di inventaris dan `stock_available >= qty_needed`.
- **`shortage`**: selisih jumlah bahan yang masih kurang apabila stok belum mencukupi.
- **`can_make`**: status kesiapan resep secara keseluruhan untuk 1 kali produksi.

### Fitur Tambahan: Asisten Ide Menu

Sebagai pelengkap operasional dapur, endpoint `POST /api/ai/generate-recipe` menyediakan rekomendasi resep menggunakan `@google/genai` (`gemini-3.8-flash`) dengan mekanisme _auto-retry_ dan _fallback_ lokal. Setiap bahan yang dihasilkan tetap dicocokkan dengan tabel `ingredients` pengguna sehingga bahan yang belum ada di stok ditandai dengan label **`Tidak Tersedia`**.

## Teknologi

| Kategori           | Teknologi                                                                           |
| ------------------ | ----------------------------------------------------------------------------------- |
| Frontend Framework | **Next.js** (App Router), **React**                                                 |
| Styling & UI       | **Tailwind CSS**, **Radix UI** (`AlertDialog`, `Select`, `Toast`), **lucide-react** |
| Backend Runtime    | **Node.js**, **Express** (ES Modules)                                               |
| Database & Migrasi | **PostgreSQL** / **Supabase** (`pg` dengan SSL Session Pooler), **node-pg-migrate** |
| Validasi & Auth    | **Joi**, **JSON Web Token (JWT)**, **Google OAuth**                                 |
| HTTP Client        | **Axios** (dengan interceptor token otomatis)                                       |
| Fitur Tambahan     | **Google GenAI SDK (`@google/genai`)** untuk asisten ide menu                       |

## Cakupan Data & Aturan Inventaris

Aturan validasi diterapkan konsisten di lapisan antarmuka dan API agar pencatatan inventaris tetap rapi untuk kebutuhan rumah tangga maupun UMKM:

| Aspek                  | Ketentuan Sistem                                                                                   |
| ---------------------- | -------------------------------------------------------------------------------------------------- |
| **Kategori Bahan**     | `Protein`, `Sayuran & Buah`, `Dairy & Telur`, `Tepung & Kering`, `Bumbu & Saus`, `Lainnya`         |
| **Satuan Diskrit**     | `butir`, `pcs`, `siung`, `batang`, `lembar`, `bungkus`, `botol`, `kaleng`, `ikat` (bilangan bulat) |
| **Satuan Kontinu**     | `gram`, `kg`, `ml`, `liter`, `sdm`, `sdt` (mendukung hingga 2 angka desimal pada jumlah stok)      |
| **Stok Minimum**       | Wajib berupa **bilangan bulat** (`integer >= 0`) untuk seluruh jenis satuan                        |
| **Status Kedaluwarsa** | Aman (`> 5 hari`), Mendekati Kedaluwarsa (`H-5` s.d. `H-1`), `Kedaluwarsa Hari Ini`, `Kedaluwarsa` |

## Privasi & Keamanan

- **Isolasi Data Per Pengguna.** Seluruh kueri inventaris, resep, produksi, dan riwayat transaksi memfilter `user_id` dari token JWT sehingga setiap akun hanya dapat mengakses data dapurnya sendiri.
- **Koneksi Database Terenkripsi.** Koneksi ke Supabase menggunakan SSL (`PGSSLMODE=no-verify`) melalui _Session Pooler_ dengan kredensial yang disimpan di `backend/.env`.
- **Validasi Input Ketat.** Setiap permintaan `POST` dan `PUT` divalidasi menggunakan skema **Joi** sebelum diproses ke database untuk mencegah kuantitas negatif atau format data tidak valid.
- **Kredensial Eksternal di Server.** Kunci API dan rahasia JWT hanya dibaca di sisi backend Express dan tidak pernah diekspos ke bundle frontend.

## Menjalankan Secara Lokal

Prasyarat: **Node.js 20+** dan database **PostgreSQL** atau akun **Supabase**.

### 1. Klon Repositori

```bash
git clone [https://github.com/hniasal/FridgeFlow.git](https://github.com/hniasal/FridgeFlow.git)
cd FridgeFlow
```

### 2. Konfigurasi & Jalankan Backend

```bash
cd backend
npm install

# Salin contoh environment dan isi DATABASE_URL serta JWT_SECRET
cp .env.example .env

# Jalankan migrasi tabel database
npm run migrate up

# Jalankan server pengembangan (port 5000)
npm run dev
```

### 3. Konfigurasi & Jalankan Frontend

Buka terminal baru pada folder utama proyek:

```bash
cd frontend
npm install

# Salin contoh environment frontend
cp .env.example .env.local

# Jalankan aplikasi Next.js (port 3000)
npm run dev
```

Buka `http://localhost:3000`, buat akun baru atau masuk dengan Google, lalu mulai catat bahan baku dapur Anda.

## Variabel Lingkungan

### Backend (`backend/.env`)

| Variabel           | Wajib    | Fungsi                                                                |
| ------------------ | -------- | --------------------------------------------------------------------- |
| `PORT`             | Ya       | Port server Express (default `5000`).                                 |
| `DATABASE_URL`     | Ya       | Connection string PostgreSQL / Supabase Session Pooler.               |
| `PGSSLMODE`        | Ya       | Set ke `no-verify` untuk koneksi SSL ke Supabase.                     |
| `JWT_SECRET`       | Ya       | Kunci rahasia untuk penandatanganan token autentikasi pengguna.       |
| `GEMINI_API_KEY`   | Opsional | Kunci API Google AI Studio untuk fitur tambahan **Asisten Ide Menu**. |
| `GOOGLE_CLIENT_ID` | Opsional | Client ID OAuth apabila fitur masuk dengan akun Google diaktifkan.    |

### Frontend (`frontend/.env.local`)

| Variabel                       | Wajib    | Fungsi                                                       |
| ------------------------------ | -------- | ------------------------------------------------------------ |
| `NEXT_PUBLIC_API_URL`          | Ya       | URL dasar backend API (contoh: `http://localhost:5000/api`). |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Opsional | Client ID Google OAuth untuk tombol masuk dengan Google.     |

## Deploy

Aplikasi dirancang untuk dideploy secara terpisah antara database, backend, dan frontend:

1. **Database (Supabase):** Buat proyek baru di Supabase, salin URI _Session Pooler_ dengan password alfanumerik tanpa karakter simbol khusus, lalu jalankan `npm run migrate up` untuk membentuk skema tabel.
2. **Backend (Render / Railway):** Hubungkan direktori `backend/`, atur _Build Command_ `npm install` dan _Start Command_ `npm start`, lalu tambahkan variabel lingkungan dari `backend/.env`.
3. **Frontend (Vercel):** Import repositori dengan _Root Directory_ `frontend`, isi `NEXT_PUBLIC_API_URL` mengarah ke URL backend yang aktif, lalu jalankan **Deploy**.

## Struktur Proyek

```
fridgeflow-v3/
├─ backend/
│  ├─ config/
│  │  └─ db.js                     # Koneksi PostgreSQL / Supabase dengan SSL
│  ├─ controllers/
│  │  ├─ authController.js         # Register, login, dan autentikasi Google
│  │  ├─ ingredientController.js   # CRUD bahan baku, restock & auto-link resep
│  │  ├─ recipeController.js       # CRUD resep, cek kecukupan & produksi potong stok
│  │  ├─ transactionController.js  # Riwayat audit transaksi stok masuk & keluar
│  │  └─ aiController.js           # Ringkasan insight & asisten ide menu tambahan
│  ├─ middlewares/                 # Verifikasi JWT & penanganan error
│  ├─ migrations/                  # Skema tabel PostgreSQL (node-pg-migrate)
│  ├─ routes/                      # Definisi endpoint REST API
│  ├─ validations/                 # Skema validasi Joi & aturan satuan diskrit
│  └─ server.js                    # Entry point server Express
├─ frontend/
│  └─ src/
│     ├─ api/
│     │  └─ axios.js               # Konfigurasi HTTP client & interceptor JWT
│     ├─ app/
│     │  ├─ (auth)/                # Halaman masuk & daftar akun
│     │  └─ (dashboard)/           # Layout utama aplikasi terproteksi
│     │     ├─ page.js             # Dashboard ringkasan kondisi dapur
│     │     ├─ ingredients/        # Inventaris bahan baku & modal restock
│     │     ├─ recipes/            # Buku resep, takaran & pengarsipan
│     │     ├─ production/         # Pengecekan kecukupan & eksekusi produksi
│     │     ├─ transactions/       # Riwayat transaksi stok masuk/keluar
│     │     └─ ai-chef/            # Asisten ide menu (fitur tambahan)
│     ├─ components/
│     │  ├─ ConfirmModal.jsx       # Modal konfirmasi & toast (Radix UI)
│     │  ├─ UnitSelect.jsx         # Pemilih satuan bahan baku (Radix UI)
│     │  └─ RichNotesEditor.jsx    # Editor langkah pembuatan resep
│     └─ utils/
│        └─ formatters.js          # Pemformat angka, tanggal & status peringatan
└─ README.md
```

## Aksesibilitas & Performa

- **Komponen UI Aksesibel.** Menggunakan primitif **Radix UI** (`AlertDialog`, `Select`, `Toast`) yang mendukung navigasi keyboard, manajemen fokus otomatis, dan atribut ARIA standar di atas gaya visual Tailwind CSS.
- **Tata Letak Responsif.** Antarmuka menyesuaikan layar ponsel hingga desktop agar praktis digunakan saat mencatat stok maupun mengecek takaran di dapur.
- **Integritas Data Transaksional.** Seluruh perhitungan stok dan pencatatan riwayat dijalankan di dalam transaksi database untuk menjaga konsistensi data.

## Batasan & Rencana Lanjutan

- **Konversi Satuan Otomatis.** Saat ini pencocokan kecukupan stok menyamakan satuan yang tercatat di inventaris dan resep. Rencana lanjutan mencakup konversi otomatis antar-satuan sejenis (`kg` $\leftrightarrow$ `gram`, `liter` $\leftrightarrow$ `ml`).
- **Perhitungan HPP & Biaya Belanja UMKM.** Menambahkan pencatatan harga beli per bahan baku agar sistem dapat menghitung Harga Pokok Produksi per resep serta estimasi biaya belanja untuk bahan yang stoknya kurang.
- **Ekspor Daftar Belanja & Laporan Stok.** Menghasilkan daftar belanja otomatis dari bahan yang berada di bawah batas minimum dan rekap mutasi stok bulanan dalam format CSV atau PDF.

## Kredit & Sumber

- **Next.js & React** — fondasi antarmuka web modern.
- **Tailwind CSS & Radix UI** — sistem styling utilitas dan primitif komponen aksesibel.
- **Supabase & PostgreSQL** — penyimpanan data relasional dan integritas transaksi ACID.
- **Google GenAI SDK** — layanan pendukung untuk fitur asisten ide menu.

---

<p align="center"><em>FridgeFlow — kelola inventaris dapur lebih tertib, produksi lebih terukur, dan kurangi bahan terbuang.</em></p>
