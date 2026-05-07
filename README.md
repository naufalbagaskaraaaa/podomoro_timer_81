# Podomoro - Timer For Develop Focus

Aplikasi produktivitas untuk manajemen waktu menggunakan teknik Pomodoro. Proyek ini dikembangkan murni menggunakan pendekatan **Vibe Coding**, di mana alur kerja eksperimental mengandalkan peran eksekutif AI, sedangkan *developer* bertindak secara penuh sebagai pengarah tingkat atas (konseptor/arsitek).

## 🤖 The Vibe Coding Experience

Proyek eksperimental ini dibangun melalui kolaborasi *multi-agent* tingkat tinggi dengan pembagian *role* sebagai berikut:

- **Architecture & Conceptualization**
  Dirancang menggunakan **Claude Opus 4.6**. Claude menganalisa ide struktur *client-side*, tata letak (*layouting*), serta merancang bagaimana *flow* operasional aplikasi berjalan.
- **Code Generation & Engineering**
  Pembangunan logika utama, styling, hingga interaksi kerangka kerja sistem (*codebase*) dibangun secara dinamis oleh **Gemini Pro 3.0** berdasarkan hasil *brainstorming*.
- **Refactoring & Workspace Execution**
  Diskusi, pembersihan kode usang (*clean architecture*), serta manajemen modifikasi langsung di *environment* VS Code dieksekusi menggunakan **Gemini 3.1 Pro Preview**.

## ✨ Key Features

- **Chart.js Analytics**
  Description: Ini merupakan fitur untuk memvisualisasikan data produktivitas harian pengguna. Setiap sesi fokus yang diselesaikan akan direkam secara otomatis di Local Storage. Data tersebut kemudian diintegrasikan ke dalam grafik analitik menggunakan library Chart.js agar pengguna dapat dengan mudah melacak performa kerja mereka dari hari ke hari.

- **System Security & Sanitization**
  Description: Walaupun berjalan murni di sisi *client-side*, fitur ini dirancang untuk menjamin stabilitas dan keamanan aplikasi. Sistem dibekali modul khusus (fungsi `SEC`) untuk validasi *input*, sanitasi string (mencegah XSS), mekanisme *Safe Parsing* JSON, filter batas ukuran durasi (*time clamping*), perlindungan *Anti-Iframe*, serta penerapan Content Security Policy (CSP) ketat pada tingkat dokumen HTML.

- **Background Web Worker Timer**
  Description: Ini merupakan fitur *core* perhitungan mundur (*timer*) yang diisolasi ke dalam *Web Worker*. Berbeda dengan `setInterval` biasa, Web Worker berjalan terpisah dari beban *thread* UI. Hal ini memastikan waktu (detik) akan terus berjalan presisi tanpa *lag/freeze* ("browser throttling") meskipun pengguna meminimize halaman atau pindah ke Tab lain.

- **Progressive Web App (PWA)**
  Description: Ini merupakan fitur yang memungkinkan aplikasi web ini terdaftar melalui *Manifest* dan disangga oleh `sw.js` (Service Worker) sehingga pengguna bisa langsung menginstal (Add to Home Screen) alat Pomodoro ini ke dalam Desktop atau HP untuk diakses layaknya aplikasi *Native*.

## 🛠 Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+). Tidak ada framework berat yang digunakan agar performa sangat kilat (Zero Dependency UI Architecture).
- **Libraries:** Chart.js (v4+) untuk rendering grafik.
- **APIs:** Service Worker API, Web Worker API, Web Storage API.

## � File Structure Overview

Standar pada proyek ini tidak memerlukan dokumentasi per-fungsi, melainkan pembagian tanggung jawab (Separation of Concerns) secara spesifik di tiap file:

- `index.html` — Kerangka utama UI, markup, dan pengaturan meta tag (termasuk CSP).
- `style.css` — Seluruh visual layout, variabel tema, animasi, dan responsivitas.
- `script.js` — Logika *core* aplikasi (state management, DOM *manipulation*, kalkulasi sesi, dan integrasi Chart.js).
- `timer.worker.js` — Web Worker untuk perhitungan waktu mundur presisi di *"background"* yang tidak terpengaruh oleh performa UI.
- `sw.js` — Service worker untuk memberikan fungsionalitas PWA (Progressive Web App) seperti *caching* dan instalasi *offline*.
- `test.js` — Modul independen berisi *script test* (Unit & Integration) yang difokuskan untuk dijalankan langsung pada environment peramban (Browser console).
- `manifest.json` — Konfigurasi metadata aplikasi untuk PWA dan mobile/desktop installability.
- `.htaccess` — Konfigurasi *server-side* (Apache) yang mengatur *caching* agresif untuk file statis, kompresi GZIP, pembaruan keamanan (header), dan pengalihan (rewrites) guna mengoptimalkan pemuatan PWA.

## �🚀 How to Run

Kareka aplikasi ini bersifat murni *client-side*:
1. Unduh atau *Clone* repositori ini.
2. Buka file `index.html` menggunakan browser modern (Chrome, Edge, Firefox, Safari).
3. Atau, untuk pengalaman terbaik, jalankan melalui web server statis ringan seperti Live Server (VS Code) atau command sederhana (misal `npx serve`).
