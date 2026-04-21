# FlixxMart — E-Commerce SPA

FlixxMart adalah prototype website e-commerce berbasis **Single Page Application (SPA)** yang dibangun menggunakan HTML5, Tailwind CSS (CDN), dan JavaScript murni tanpa framework atau backend. Semua data disimpan di **LocalStorage** browser, sehingga tidak memerlukan server atau database eksternal.

Output project hanya terdiri dari dua file utama: `index.html` dan `script.js`.

---

## Fitur

### Halaman Landing
- Hero section dengan gradient dan CTA
- Statistik toko (produk, pelanggan, rating)
- Kategori populer dengan navigasi langsung ke filter produk
- Keunggulan toko (pengiriman, keamanan, garansi retur)

### Autentikasi
- Registrasi akun baru dengan validasi email unik dan password minimal 6 karakter
- Login dengan sesi yang disimpan di LocalStorage
- Logout otomatis membersihkan sesi
- Akun demo tersedia (lihat bagian **Cara Menjalankan**)

### Katalog Produk
- 8 produk default dari 4 kategori: Pakaian, Elektronik, Sepatu, Tas
- Grid responsif (2 kolom mobile → 4 kolom desktop)
- Skeleton loading saat pertama kali membuka halaman produk
- Filter real-time: pencarian nama, kategori, dan rentang harga
- Modal detail produk

### Keranjang Belanja
- Tambah produk dengan animasi gambar terbang ke ikon keranjang
- Update quantity langsung di halaman keranjang
- Hapus item individual
- Badge jumlah item di navbar dengan animasi pop
- Data keranjang persisten di LocalStorage

### Checkout & Pesanan
- Form checkout dengan validasi field wajib (nama, alamat, nomor HP)
- Generate Transaction ID unik setiap transaksi
- Riwayat pesanan lengkap dengan detail item dan total harga
- Tombol kembali ke toko di halaman pesanan

### Admin Panel
- Akses eksklusif untuk akun admin
- Dashboard statistik: total produk, customer, pesanan, dan pendapatan
- Tab Produk: tambah produk baru (dengan form validasi) dan hapus produk, ditampilkan sebagai card dengan gambar
- Tab Customer: card per customer dengan avatar, jumlah pesanan, dan total belanja
- Tab Pesanan: detail setiap transaksi dengan info penerima dan item yang dipesan
- Navbar toko (search, filter, keranjang) otomatis disembunyikan saat di panel admin

### UI & UX
- Dark mode dengan preferensi tersimpan di LocalStorage
- Toast notifikasi elegan dari pojok kanan bawah dengan progress bar dan animasi slide-up
- Animasi fly-to-cart saat menambahkan produk ke keranjang
- Desain responsif untuk mobile dan desktop

---

## Struktur File

```
FlixxMart/
├── index.html              # Struktur HTML seluruh halaman SPA
├── script.js               # Semua logika JavaScript (modul-modul)
├── images/
│   └── products/
│       ├── README.txt      # Panduan upload gambar produk
│       ├── prod_001.jpg    # Gambar produk (upload manual)
│       └── ...
└── README.md
```

---

## Cara Menjalankan

Project ini tidak memerlukan instalasi apapun. Cukup buka file `index.html` di browser.

### Opsi 1 — Buka langsung
Klik dua kali file `index.html`, atau klik kanan → *Open with* → pilih browser (Chrome, Firefox, Edge, dll).

### Opsi 2 — Live Server (disarankan)
Jika menggunakan VS Code, install ekstensi **Live Server**, lalu klik kanan `index.html` → *Open with Live Server*. Ini memastikan gambar lokal dari folder `images/products/` dapat dimuat dengan benar.

---

## Akun Demo

| Role     | Email               | Password   |
|----------|---------------------|------------|
| Admin    | admin@toko.com      | admin123   |
| Customer | budi@email.com      | budi123    |
| Customer | siti@email.com      | siti123    |
| Customer | andi@email.com      | andi123    |

---

## Upload Gambar Produk

Letakkan file gambar di folder `images/products/` dengan nama sesuai ID produk:

| File            | Produk                  |
|-----------------|-------------------------|
| prod_001.jpg    | Kemeja Batik Pria       |
| prod_002.jpg    | Dress Casual Wanita     |
| prod_003.jpg    | Laptop Stand Aluminium  |
| prod_004.jpg    | Wireless Mouse          |
| prod_005.jpg    | Sepatu Sneakers Pria    |
| prod_006.jpg    | Sandal Wanita Casual    |
| prod_007.jpg    | Tas Ransel Laptop       |
| prod_008.jpg    | Dompet Kulit Pria       |

Untuk produk baru yang ditambah via Admin Panel, isi field gambar dengan path `images/products/nama_file.jpg` lalu upload file ke folder tersebut.

---

## Teknologi

- **HTML5** — Struktur SPA
- **Tailwind CSS** (via CDN) — Styling dan responsivitas
- **JavaScript ES6+** — Logika aplikasi tanpa framework
- **LocalStorage** — Penyimpanan data persisten di browser
