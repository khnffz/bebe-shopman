DEVELOPMENT REQUIREMENT — PRODUCT IMAGE TEMPLATE
1. CONTEXT

Aplikasi sudah memiliki:

Fitur Product.
Fitur Shop.
Fitur Shop Template untuk mengatur desain/gambar produk berdasarkan masing-masing shop.
Fitur Generate Gambar Utama Produk.
Shop Template menyimpan konfigurasi desain dalam bentuk JSON.

Saat ini, Product Image mengambil JSON dari Shop Template.

Saya ingin menambahkan kemampuan agar setiap Product dapat memiliki template/image JSON sendiri, sehingga template pada Product dapat diedit tanpa mengubah template pada Shop.

2. TUJUAN

Tambahkan fitur "Edit Image" pada Product.

Fitur ini memungkinkan user untuk:

Melihat template image Product berdasarkan Shop.
Mengedit template tersebut menggunakan editor yang sama seperti Edit Template pada Shop.
Menyimpan hasil edit sebagai JSON khusus untuk Product.
Menggunakan JSON Product tersebut saat menampilkan atau melakukan generate gambar.
Tetap menggunakan JSON dari Shop Template apabila Product belum memiliki template sendiri.
3. TOMBOL "EDIT IMAGE"

Pada halaman/detail Product, tambahkan tombol:

Edit Image

Tombol ini membuka editor gambar/template yang menggunakan editor dan komponen yang sama dengan fitur Edit Template pada Shop.

Jangan membuat editor baru jika editor Shop Template sudah dapat digunakan kembali.

Gunakan kembali:

UI editor
Canvas/editor
Element/component
Property editor
Fungsi save
Struktur JSON
Mekanisme rendering

sejauh memungkinkan.

4. PRODUCT MEMILIKI TEMPLATE BERDASARKAN SHOP

Setiap Product dapat memiliki beberapa template.

Jumlah template Product mengikuti jumlah Shop yang terkait dengan Product.

Contoh:

Product A
├── Shop 1
│   └── Product Template JSON
├── Shop 2
│   └── Product Template JSON
└── Shop 3
    └── Product Template JSON

Artinya:

1 Product + 1 Shop = 1 Product Image Template

Jangan menggunakan satu JSON global untuk seluruh Product apabila Product tersebut digunakan pada beberapa Shop.

5. INITIAL TEMPLATE / FALLBACK

Ketika Product belum memiliki template sendiri untuk Shop tertentu, gunakan JSON dari Shop Template sebagai sumber awal.

Contoh:

Shop Template
Shop A
└── template_json

Product
Product A
└── Shop A
    └── belum memiliki template

Maka ketika Product Image dibuka:

Product A + Shop A
        ↓
Belum ada Product Template
        ↓
Gunakan Shop Template JSON
        ↓
Tampilkan di Editor

Namun, jangan langsung menganggap JSON tersebut sebagai JSON Product yang sudah tersimpan.

JSON dari Shop Template hanya digunakan sebagai fallback/default source sampai user melakukan perubahan dan menyimpannya.

6. SAAT USER MELAKUKAN EDIT DAN SAVE

Jika Product belum memiliki template sendiri:

Shop Template JSON
        ↓
Buka Edit Image
        ↓
User melakukan perubahan
        ↓
User klik Save
        ↓
Simpan JSON hasil edit
        ↓
Product memiliki Product Template JSON sendiri

Setelah berhasil disimpan, JSON tersebut menjadi sumber utama untuk Product tersebut.

Shop Template tidak boleh ikut berubah.

7. PRIORITAS SUMBER JSON

Gunakan aturan prioritas berikut:

Product Template JSON
        ↓
Jika tidak tersedia
        ↓
Shop Template JSON

Dengan kata lain:
Jika Product sudah memiliki JSON sendiri

Gunakan:

Product Template JSON
Jika Product belum memiliki JSON sendiri

Gunakan:

Shop Template JSON

Jangan menggunakan JSON Shop Template apabila Product Template JSON sudah tersedia.

8. GENERATE GAMBAR UTAMA PRODUK

Sesuaikan proses Generate Gambar Utama Produk dengan mekanisme prioritas yang sama.

Untuk setiap Product + Shop:

Generate Gambar Utama Produk
          ↓
Cek Product Template
          ↓
Apakah Product Template tersedia?
       /          \
     YA            TIDAK
      ↓              ↓
Gunakan JSON      Gunakan JSON
Product Template  Shop Template
      ↓              ↓
       Generate Image
Aturan utama

Jika Product sudah memiliki template:

Product Template JSON

maka wajib digunakan.

Jika Product belum memiliki template:

Shop Template JSON

yang digunakan.