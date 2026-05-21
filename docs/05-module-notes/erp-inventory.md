# Catatan Modul Inventori (ERP Inventory)

Modul Inventori mengurus semua yang berkaitan dengan barang — stok produk, bahan baku, dan barang jadi. Tujuan utamanya: stok tidak boleh kosong, tidak boleh kelebihan, dan setiap pemakaian barang harus tercatat. Ini penting banget karena produk habis pakai (serum, lem, masker) adalah biaya operasional harian.

Ada 3 area utama di modul ini:

**Stok Barang**
Mencatat semua barang masuk (dari supplier) dan barang keluar (dipakai untuk treatment atau dijual). Setiap barang punya kartu stok — riwayat lengkap kapan masuk, kapan keluar, berapa jumlahnya, dan siapa yang memproses. Ada juga fitur opname stok (stock opname / stock take) untuk mencocokkan stok fisik dengan catatan sistem.

**BOM (Bill of Material)**
BOM adalah resep standar untuk tiap treatment. Misalnya, untuk 1x treatment Eyelash Extension butuh: 1 box lem, 2 strip lash, 1 set aplikator. Dengan BOM, sistem bisa otomatis menghitung berapa banyak bahan yang harus disediakan dan berapa biaya produksi per treatment.

**WIP (Work in Progress)**
Kalau salon memproduksi barang sendiri (misalnya membuat serum bulu mata dalam batch), proses produksinya dicatat di WIP. Mulai dari bahan baku diambil dari stok, diproses, sampai jadi barang jadi yang siap dipakai atau dijual.

**Fitur utama:**
- **Barang Masuk** — Catat penerimaan barang dari supplier dengan nomor referensi
- **Barang Keluar** — Catat pemakaian barang untuk treatment atau penjualan bebas
- **Kartu Stok** — Riwayat lengkap pergerakan setiap produk
- **Opname Stok** — Cek fisik stok berkala, sistem otomatis hitung selisih
- **Bill of Material** — Resep standar bahan untuk tiap treatment
- **WIP / Produksi** — Catat produksi barang jadi dari bahan baku (batch)
