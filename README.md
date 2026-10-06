# Papan Suara

Aplikasi web statis untuk mencatat suara pemilihan ketua. Ketik nama calon dan tekan **Tambah 1 suara**. Nama yang sama mendapat tambahan satu suara; nama baru muncul otomatis. Hasil langsung menampilkan peringkat, jumlah, dan persentase.

## Cara memakai

1. Buka alamat GitHub Pages setelah proyek dipublikasikan, atau jalankan server lokal seperti petunjuk di bawah.
2. Ketik nama calon, misalnya `Andy`, lalu tekan **Tambah 1 suara** atau Enter.
3. Ulangi untuk suara berikutnya. `andy` dan ` Andy ` dihitung sebagai calon yang sama.
4. Gunakan **Batalkan suara terakhir** jika entri terakhir keliru.
5. Unduh cadangan secara berkala. Tombol **Pulihkan cadangan** akan mengganti hasil yang sedang tersimpan dengan berkas cadangan tersebut.

Data tersimpan di browser dan perangkat yang dipakai. Sebaiknya gunakan browser dan alamat situs yang sama sepanjang pemilihan. Bila data browser dibersihkan, gunakan berkas cadangan untuk memulihkannya. GitHub Pages hanya menyediakan halaman aplikasi, bukan sinkronisasi suara antarperangkat.

## Menjalankan secara lokal

Jalankan server statis dari folder ini agar penyimpanan browser berperilaku sama seperti pada situs online:

```bash
python3 -m http.server 8000
```

Lalu buka `http://localhost:8000` pada browser. Tidak ada paket atau proses build yang perlu dipasang.

## Repository GitHub

Repository proyek: [samuelsteven0902/papan-suara](https://github.com/samuelsteven0902/papan-suara). Kelima berkas proyek sudah diunggah ke branch `main`.

Untuk pembaruan berikutnya melalui Terminal, jalankan perintah dari dalam folder `papan-suara` ini:

```bash
git add .
git commit -m "Perbarui papan suara"
git push
```

Gunakan `git add .` agar semua berkas aplikasi yang berubah ikut terunggah. Perintah `git add README.md` saja hanya akan mengunggah panduan dan membuat situs tidak lengkap.

### Alternatif: unggah melalui situs GitHub

1. Buka repository [samuelsteven0902/papan-suara](https://github.com/samuelsteven0902/papan-suara) dan masuk ke akun pemiliknya.
2. Pilih **Add file → Upload files**.
3. Unggah seluruh isi folder ini: `index.html`, `style.css`, `app.js`, `PERANCANGAN.md`, dan `README.md`. Pastikan ketiga berkas aplikasi berada di akar repository, bukan di dalam subfolder tambahan.
4. Simpan perubahan atau *commit*.

## Publikasi di Vercel

1. Masuk ke [dashboard Vercel](https://vercel.com/dashboard) memakai akun yang memiliki akses ke repository GitHub tersebut.
2. Pilih **Add New → Project** atau **New Project**, lalu hubungkan GitHub jika diminta.
3. Cari repository **samuelsteven0902/papan-suara** dan pilih **Import**.
4. Pada konfigurasi proyek, pilih **Framework Preset: Other**. Biarkan **Root Directory** di akar repository (`./`). Situs ini tidak memerlukan paket atau proses build: kosongkan **Build Command**. Karena tidak ada folder `public`, Vercel akan menyajikan berkas dari akar repository; **Output Directory** dapat dibiarkan pada bawaan/`./`.
5. Pilih **Deploy**. Setelah statusnya berhasil, buka alamat `*.vercel.app` yang diberikan Vercel dan coba masukkan satu suara.

Setiap perubahan baru yang didorong ke branch produksi GitHub akan membuat deployment baru secara otomatis. Data suara tetap tersimpan pada browser dan alamat situs tertentu; berpindah dari alamat lokal atau GitHub Pages ke alamat Vercel memerlukan ekspor lalu impor cadangan jika sudah ada suara.

Rujukan resmi: [impor repository Git ke Vercel](https://vercel.com/docs/git) dan [pengaturan situs statis tanpa build](https://vercel.com/docs/builds).

## Opsi lain: GitHub Pages

Jika ingin memakai GitHub Pages, buka **Settings → Pages** di repository. Pada **Build and deployment**, pilih **Deploy from a branch**, cabang utama (biasanya `main`), dan folder `/ (root)`, lalu simpan. Alamatnya biasanya `https://samuelsteven0902.github.io/papan-suara/`.

Hasil suara di browser tidak ikut terunggah ke GitHub atau Vercel.

Rujukan resmi: [mengunggah berkas ke repository](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository) dan [mengatur sumber publikasi GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Struktur

- `index.html`: struktur halaman.
- `style.css`: tampilan responsif.
- `app.js`: logika suara, penyimpanan, cadangan, dan pemulihan.
- `PERANCANGAN.md`: tujuan, keputusan, alur, dan batasan.

## Catatan operasional

Satu penekanan tombol mencatat satu suara. Aplikasi tidak mencatat identitas pemilih atau memverifikasi apakah seseorang sudah memilih. Jika dibutuhkan audit pemilih atau sinkronisasi beberapa perangkat, perlu versi lanjutan dengan layanan penyimpanan bersama.
