# 📸 Cheki Pose Gacha

> Bingung mau pose apa pas cheki bareng oshi? **Gacha aja!** ✌️

Pose generator interaktif untuk sesi **chekikai** (foto instax bareng idol). Klik tombol gacha, dan cheki-nya akan "nge-print" keluar dari kamera lengkap dengan animasi developing ala instax asli — berisi instruksi pose untuk kamu dan oshi-mu.

## ✨ Features

- 🎲 **Random pose gacha** — 22 pose dengan kaomoji ilustrasi + instruksi terpisah untuk fan & idol
- 📸 **Instax printing animation** — cheki slide keluar dari slot kamera + efek foto developing
- 🏷️ **Filter kategori** — Classic, Lucu, Sweet, dan Chaos
- 🔢 **Gacha counter** — nomor seri cheki di tiap hasil, berasa koleksi beneran
- ♿ **Accessible** — keyboard-friendly, `aria-live` untuk hasil gacha, respect `prefers-reduced-motion`
- 📱 **Responsive** — nyaman dipakai di HP pas lagi antri chekikai

## 🚀 Getting Started

Nggak butuh build step apapun — pure HTML/CSS/JS dalam satu file.

```bash
# Clone repo
git clone https://github.com/<username>/cheki-pose-gacha.git
cd cheki-pose-gacha

# Buka langsung di browser
open index.html        # macOS
start index.html       # Windows
```

Atau deploy gratis ke **GitHub Pages**: Settings → Pages → deploy from branch `main`, folder `/ (root)`.

## 🎨 Menambah Pose Baru

Tinggal tambahkan object baru ke array `POSES` di `index.html`:

```js
{
  cat: 'sweet',                        // classic | lucu | sweet | chaos
  name: 'Nama Pose',
  kao: '(´｡• ᵕ •｡`) ♡',               // kaomoji ilustrasi
  you: 'Instruksi pose untuk kamu',
  idol: 'Instruksi pose untuk oshi',
  stickers: ['💖', '✨']               // 2 emoji sticker di pojok foto
}
```

## 🗺️ Roadmap / Future Plans

### v1.1 — Mode Expansion
- [x] 🤳 **Duo Selfie Mode** — pose selfie berdua (kamera dipegang fan), framing landscape
- [x] 💁 **Solo Idol Mode** — pose gacha buat idol yang lagi foto solo cheki / konten fansign
- [x] 🧑‍🤝‍🧑 **Group Cheki Mode** — pose untuk cheki bareng 2+ member sekaligus

### v1.2 — Shareability
- [x] 💾 **Download as PNG** — export hasil cheki jadi gambar (html2canvas) buat di-share ke sosmed
- [x] 🔗 **Share link** — URL dengan pose ID biar bisa kirim pose ke temen ("kita pose ini yuk!")
- [x] 📋 **Copy instruksi** — satu tombol copy instruksi pose ke clipboard

### v1.3 — Gacha Feels
- [x] ⭐ **Rarity system** — pose common / rare / SSR dengan rate berbeda + animasi khusus SSR
- [x] 📚 **Pose collection book** — riwayat pose yang pernah didapat (localStorage), gotta collect 'em all
- [x] 🎰 **Pity system** — dijamin dapet SSR tiap 10 gacha, biar autentik wkwk

### v1.4 — Customization
- [x] 🎨 **Theme picker** — warna kamera ganti sesuai warna oshi (member color)
- [x] ✍️ **Custom pose** — form rahasia buat masukin pose karangan sendiri
- [x] 🌐 **English support** — i18n sederhana biar wota luar bisa pake

## 🛠️ Tech Stack

- Vanilla HTML / CSS / JavaScript — zero dependencies
- Google Fonts: Baloo 2, Zen Maru Gothic, Caveat
- CSS animations (`@keyframes`) untuk efek printing & developing

## 📄 License

MIT — bebas dipakai, dimodif, dan di-fork. Kalau dipakai buat event chekikai beneran, kabarin ya! 📸

---

Dibuat dengan ♥ buat para wota yang suka mati gaya pas chekikai
