const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8081;
const DATA_DIR = path.join(__dirname, 'data');

app.use(cors()); // biar API ini bisa dipanggil dari app mobile / domain lain
app.use(express.json());

// Serve frontend sebagai static files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ---------- Helper ----------
function readJSON(file) {
  const filePath = path.join(DATA_DIR, file);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}
function writeJSON(file, data) {
  const filePath = path.join(DATA_DIR, file);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ---------- API ROUTES ----------

// Profil dinas
app.get('/api/profil', (req, res) => {
  try {
    res.json(readJSON('profil.json'));
  } catch (e) {
    res.status(500).json({ error: 'Gagal memuat data profil' });
  }
});

// Layanan & kontak darurat
app.get('/api/layanan', (req, res) => {
  try {
    res.json(readJSON('layanan.json'));
  } catch (e) {
    res.status(500).json({ error: 'Gagal memuat data layanan' });
  }
});

// Program kerja
app.get('/api/program', (req, res) => {
  try {
    res.json(readJSON('program.json'));
  } catch (e) {
    res.status(500).json({ error: 'Gagal memuat data program' });
  }
});

// Berita — list
app.get('/api/berita', (req, res) => {
  try {
    const berita = readJSON('berita.json');
    berita.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    res.json(berita);
  } catch (e) {
    res.status(500).json({ error: 'Gagal memuat data berita' });
  }
});

// Berita — detail by id
app.get('/api/berita/:id', (req, res) => {
  try {
    const berita = readJSON('berita.json');
    const item = berita.find((b) => b.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'Berita tidak ditemukan' });
    res.json(item);
  } catch (e) {
    res.status(500).json({ error: 'Gagal memuat detail berita' });
  }
});

// Pengaduan — kirim laporan masyarakat
app.post('/api/pengaduan', (req, res) => {
  try {
    const { nama, kontak, lokasi, kategori, isi } = req.body;

    if (!nama || !kontak || !isi) {
      return res.status(400).json({ error: 'Nama, kontak, dan isi laporan wajib diisi' });
    }

    const pengaduan = readJSON('pengaduan.json');
    const baru = {
      id: 'PGD-' + Date.now(),
      nama,
      kontak,
      lokasi: lokasi || '-',
      kategori: kategori || 'Umum',
      isi,
      status: 'Baru diterima',
      waktu: new Date().toISOString(),
    };
    pengaduan.unshift(baru);
    writeJSON('pengaduan.json', pengaduan);

    res.status(201).json({ message: 'Laporan berhasil dikirim', data: baru });
  } catch (e) {
    res.status(500).json({ error: 'Gagal menyimpan laporan' });
  }
});

// Pengaduan — list (untuk keperluan internal / dashboard admin nanti)
app.get('/api/pengaduan', (req, res) => {
  try {
    res.json(readJSON('pengaduan.json'));
  } catch (e) {
    res.status(500).json({ error: 'Gagal memuat data pengaduan' });
  }
});

// Health check (berguna buat cek koneksi dari app mobile)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', waktu: new Date().toISOString() });
});

// Fallback -> index.html (untuk single page app di frontend)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Damkar Deli Serdang API jalan di http://localhost:${PORT}`);
});