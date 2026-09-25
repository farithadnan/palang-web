/**
 * Minimal i18n: flat key dictionaries for en + ms, read through the store's
 * reactive `lang` so templates re-render on switch. Missing keys fall back
 * to the English value, so a key left untranslated never renders garbage.
 */
import { app } from "./store.svelte.js";

const DICT = {
  en: {
    home: "Home",
    openApp: "Open app",
    features: "Features",
    how: "How it works",
    privacy: "Privacy",
    faq: "FAQ",
    menu: "Menu",
    switchLang: "Switch language",
    switchTheme: "Switch theme",

    convert: "Convert",
    palang: "Palang",
    merge: "Merge",

    consentBefore: "Before you start:",
    consentHosted:
      "You are on the developer-hosted instance (palang.oh-alam.my). The app is served from a server, but every document you add is processed on this device — the server never sees it. The network panel will show only the version check and app files.",
    consentSelf:
      "You are running your own copy — locally, on your own server, or as an installed app. Every document is processed on this device and nothing is ever sent anywhere.",
    consentAgree: "I understand and agree",

    badge: "Offline · Open source · MIT",
    title: "Prepare documents for sharing",
    lede:
      "Palang turns your photos and PDFs into ready-to-share documents — convert, stamp the bank-purpose band, merge — all on your device. Nothing is uploaded. Ever.",
    openWebApp: "Open the web app",
    viewGitHub: "View on GitHub",

    getItOnAnything: "Get it on anything",
    platformsSub: "One engine, every surface. Processing stays on your device.",
    liveNow: "Live now",
    soon: "Soon",
    open: "Open",
    arrivesWithNative: "Arrives with the native build",
    platformWebName: "Web app",
    platformWebDesc: "Works in any browser — it's this app, on this page.",
    platformApkName: "Android APK",
    platformApkDesc: "Installable app, same on-device engine.",
    platformExeName: "Desktop (EXE)",
    platformExeDesc: "Windows desktop build from the same codebase.",

    whatItDoes: "What it does",
    featuresSub: "Four things, one clean flow — no clutter, no accounts.",
    featureConvert: "Convert",
    featureConvertBody:
      "Photos into a single PDF — per-image crop and light enhance, your choice of page size, previewed instantly.",
    featurePalang: "Palang",
    featurePalangBody:
      "The official-use band — 'palang' to Malaysians: banks, government offices, companies and more. Drag, rotate and scale it like a real stamp — transparent lines that follow the text, live on the page.",
    featureMerge: "Merge",
    featureMergeBody: "Join PDFs in the order you want, straight from your device.",
    featurePrivate: "Private by construction",
    featurePrivateBody:
      "No accounts, no uploads, no tracking. Every step runs in your browser — your documents never leave your machine.",

    howWorks: "How it works",
    stepsSub: "Three steps, that's all.",
    step1: "Add your files",
    step1B: "Photos or PDFs from your device.",
    step2: "Arrange the marking",
    step2B: "Drag the band where it belongs — rotate it, size it, watch it live.",
    step3: "Download the PDF",
    step3B: "One file ready to share. Nothing was sent anywhere.",

    privateByConstruction: "Private by construction",
    private1a: "On-device processing.",
    private1b: "Conversion, stamping and merging all run in your browser.",
    private2a: "No accounts, no sign-ins, no tracking.",
    private2b: "There is nothing to profile.",
    private3a: "Open source.",
    private3b: "The entire pipeline is public under MIT — read it, run it, trust it because you can verify it.",
    private4a: "Update checks only.",
    private4b: "The sole network request is a small version manifest.",
    private5a: "PDPA-aware by design.",
    privateHostedNote:
      "This instance is served from a server — but the processing happens on this device, and the server never sees your documents.",
    privateSelfNote:
      "This is your own copy. It is served by your own setup — or runs fully offline as an installed app. Nothing is sent anywhere.",
    private5b:
      "Malaysia's PDPA 2010 governs how those who collect personal data must handle it. We don't collect it: nothing is stored, nothing is uploaded — so there is nothing to protect, leak, or lose.",

    proveIt: "Prove it yourself",
    proveHosted:
      "Open the app, process a document, then open Network activity in the footer — the panel lists every request the app makes. On this hosted instance you will only ever see the version check and static app files: nothing about your documents leaves this device.",
    proveSelf:
      "Open the app, process a document, then open Network activity in the footer — the panel lists every request the app makes. On your own copy the list stays empty: nothing is ever sent anywhere.",
    verify: "Verify",

    faq5q: "Why does my photo have a white border in the PDF?",
    faq5a:
      "Palang places each page onto the page size you chose (A4 by default) and fits the image inside it — the same way banks and offices expect copies. The preview shows exactly this. To fill the page instead, crop the photo or pick a smaller page size.",

    devTitle: "For developers",
    devSub: "Two repositories — the reference engine (Python) and the web app (in-browser engine). The web app runs fully on the client; a server is optional.",
    devEngine:
      "1 · Reference engine — github.com/farithadnan/palang",
    devEngineBody: "The Python reference implementation and the documented REST contract.",
    devWeb:
      "2 · Web app — github.com/farithadnan/palang-web",
    devWebBody: "The Svelte 5 app. Its engine (pdf-lib) runs in the browser, so development needs no server.",
    devDocker:
      "3 · Run the engine with Docker (optional)",
    devDockerBody: "You only need this if you want the Python server, not for the web app.",
    devDeploy:
      "4 · Host the web app anywhere static",
    devDeployBody:
      "The build output (dist/) is plain static files, and processing happens in the visitor's browser — so the app runs free on Vercel, Cloudflare Pages or GitHub Pages. The live demo at palang.oh-alam.my is the real app hosted this way.",

    convertLabel: "Convert to PDF",
    mergeLabel: "Merge PDFs",

    seeItLive: "See it live",
    sampleHint: "Drag the palang band onto the sample document — this is exactly how the editor feels.",
    misuseA: "A copy without a palang can be misused.",
    misuseB: "Banks, government offices and companies routinely ask for stamped copies before anything is shared.",

    startTitle: "Start using Palang",
    startBody: "Free and open source — no accounts, no tokens, no limits. Your documents never leave your device.",
    startFree: "Free forever",
    startSoon: "Coming soon",

    questions: "Questions",
    faq1q: "Do my files get uploaded?",
    faq1a:
      "No. The whole pipeline — conversion, stamping, merging — runs inside your browser. The only network request is a small version check for updates.",
    faq2q: "Is the output a real, valid PDF?",
    faq2a: "Yes. Files are produced locally as standard PDFs, openable by any reader.",
    faq3q: "Is it really open source?",
    faq3a: "MIT licensed. The web app and the reference engine are both public on GitHub — audit them or run them yourself.",
    faq4q: "How do updates work?",
    faq4a: "The app compares a version manifest when it opens and offers to update. The native builds will use the same check.",

    mitLicense: "MIT License",
    coreEngine: "Core engine",
    webApp: "Web app",
    networkActivity: "Network activity",
    noRequestsYet: "No network requests yet — everything runs on your device.",
    networkIntro: "Requests the app has made this session (the privacy proof):",
    updateAvailable: "A new version (v{version}) is available.",
    updateNow: "Update now",
    later: "Later",
  },

  ms: {
    home: "Utama",
    openApp: "Buka app",
    features: "Ciri-ciri",
    how: "Cara ia berfungsi",
    privacy: "Privasi",
    faq: "Soalan lazim",
    menu: "Menu",
    switchLang: "Tukar bahasa",
    switchTheme: "Tukar tema",

    convert: "Tukar",
    palang: "Palang",
    merge: "Gabung",

    consentBefore: "Sebelum anda mula:",
    consentHosted:
      "Anda berada di instance yang dihoskan oleh pembangun (palang.oh-alam.my). App itu dihidangkan dari pelayan, tetapi setiap dokumen yang anda tambah diproses pada peranti ini — pelayan tidak pernah melihatnya. Panel rangkaian hanya akan menunjukkan semakan versi dan fail app.",
    consentSelf:
      "Anda menjalankan salinan anda sendiri — secara tempatan, di pelayan anda sendiri, atau sebagai app yang dipasang. Setiap dokumen diproses pada peranti ini dan tiada apa-apa yang dihantar ke mana-mana.",
    consentAgree: "Saya faham dan bersetuju",

    badge: "Luar talian · Sumber terbuka · MIT",
    title: "Sediakan dokumen untuk dikongsi",
    lede:
      "Palang menukar foto dan PDF anda menjadi dokumen sedia kongsi — tukar, setem jalur bank, gabung — semuanya pada peranti anda. Tiada apa yang dimuat naik.",
    openWebApp: "Buka app web",
    viewGitHub: "Lihat di GitHub",

    getItOnAnything: "Gunakan di mana-mana",
    platformsSub: "Satu enjin, semua platform. Pemprosesan kekal pada peranti anda.",
    liveNow: "Tersedia",
    soon: "Segera",
    open: "Buka",
    arrivesWithNative: "Menyusul bersama binaan asli",
    platformWebName: "App web",
    platformWebDesc: "Berfungsi dalam mana-mana pelayar — ia app ini di halaman ini.",
    platformApkName: "APK Android",
    platformApkDesc: "App boleh dipasang, enjin luar talian yang sama.",
    platformExeName: "Desktop (EXE)",
    platformExeDesc: "Binaan desktop Windows daripada kod yang sama.",

    whatItDoes: "Apa yang ia lakukan",
    featuresSub: "Empat perkara, satu aliran bersih — tiada kekeliruan, tiada akaun.",
    featureConvert: "Tukar",
    featureConvertBody:
      "Foto menjadi satu PDF — potong dan cerahkan setiap imej, pilih saiz halaman, pratonton serta-merta.",
    featurePalang: "Palang",
    featurePalangBody:
      "Jalur kegunaan rasmi — 'palang' bagi rakyat Malaysia: bank, pejabat kerajaan, syarikat dan banyak lagi. Seret, putar dan saiz seperti setem sebenar — garisan lut sinar yang mengikuti teks, terus pada halaman.",
    featureMerge: "Gabung",
    featureMergeBody: "Gabungkan PDF mengikut urutan yang anda mahu, terus dari peranti anda.",
    featurePrivate: "Privasi terjamin",
    featurePrivateBody:
      "Tiada akaun, tiada muat naik, tiada penjejakan. Setiap langkah berjalan dalam pelayar anda — dokumen anda tidak pernah meninggalkan peranti.",

    howWorks: "Cara ia berfungsi",
    stepsSub: "Tiga langkah sahaja.",
    step1: "Tambah fail anda",
    step1B: "Foto atau PDF daripada peranti anda.",
    step2: "Susun setem",
    step2B: "Seret jalur ke tempatnya — putar, saizkan, lihat secara langsung.",
    step3: "Muat turun PDF",
    step3B: "Satu fail sedia dikongsi. Tiada apa yang dihantar ke mana-mana.",

    privateByConstruction: "Privasi terjamin",
    private1a: "Pemprosesan pada peranti.",
    private1b: "Penukaran, setem dan gabungan semuanya berjalan dalam pelayar anda.",
    private2a: "Tiada akaun, tiada daftar masuk, tiada penjejakan.",
    private2b: "Tiada apa yang boleh diprofilkan.",
    private3a: "Sumber terbuka.",
    private3b: "Keseluruhan saluran paip adalah awam di bawah MIT — baca, jalankan, percaya kerana anda boleh menyemaknya.",
    private4a: "Semakan kemas kini sahaja.",
    private4b: "Satu-satunya permintaan rangkaian ialah fail manifest versi yang kecil.",
    private5a: "Sedar PDPA.",
    privateHostedNote:
      "Instance ini dihidangkan dari pelayan — tetapi pemprosesan berlaku pada peranti ini, dan pelayan tidak pernah melihat dokumen anda.",
    privateSelfNote:
      "Ini salinan anda sendiri. Ia dihidangkan oleh persediaan anda — atau berjalan sepenuhnya luar talian sebagai app dipasang. Tiada apa-apa dihantar ke mana-mana.",
    private5b:
      "Akta Perlindungan Data Peribadi 2010 (PDPA) mengawal cara data peribadi dikendalikan oleh pihak yang mengumpulnya. Kami tidak mengumpul: tiada yang disimpan, tiada yang dimuat naik — jadi tiada apa untuk dilindungi, dibocorkan, atau hilang.",

    proveIt: "Buktikan sendiri",
    proveHosted:
      "Buka app, proses satu dokumen, kemudian buka Aktiviti rangkaian di kaki halaman — panel menyenaraikan setiap permintaan yang dibuat oleh app. Pada instance yang dihoskan ini, anda hanya akan melihat semakan versi dan fail statik app: tiada apa-apa tentang dokumen anda yang meninggalkan peranti ini.",
    proveSelf:
      "Buka app, proses satu dokumen, kemudian buka Aktiviti rangkaian di kaki halaman — panel menyenaraikan setiap permintaan yang dibuat oleh app. Pada salinan anda sendiri, senarai kekal kosong: tiada apa-apa dihantar ke mana-mana.",
    verify: "Semak",

    faq5q: "Mengapa foto saya ada sempadan putih dalam PDF?",
    faq5a:
      "Palang meletakkan setiap halaman pada saiz halaman yang anda pilih (A4 secara lalai) dan memuatkan imej di dalamnya — sama seperti yang bank dan pejabat jangkakan. Pratonton menunjukkan perkara ini dengan tepat. Untuk memenuhi halaman, potong foto atau pilih saiz halaman yang lebih kecil.",

    devTitle: "Untuk pembangun",
    devSub: "Dua repositori — enjin rujukan (Python) dan app web (enjin dalam pelayar). App web berjalan sepenuhnya pada klien; pelayan adalah pilihan.",
    devEngine:
      "1 · Enjin rujukan — github.com/farithadnan/palang",
    devEngineBody: "Implementasi rujukan Python dan kontrak REST yang didokumenkan.",
    devWeb:
      "2 · App web — github.com/farithadnan/palang-web",
    devWebBody: "App Svelte 5. Enjinnya (pdf-lib) berjalan dalam pelayar, jadi pembangunan tidak memerlukan pelayan.",
    devDocker:
      "3 · Jalankan enjin dengan Docker (pilihan)",
    devDockerBody: "Anda hanya perlukan ini jika mahu pelayan Python, bukan untuk app web.",
    devDeploy:
      "4 · Hoskan app web di mana-mana statik",
    devDeployBody:
      "Hasil binaan (dist/) ialah fail statik biasa, dan pemprosesan berlaku dalam pelayar pelawat — jadi app berjalan percuma di Vercel, Cloudflare Pages atau GitHub Pages. Demo langsung di palang.oh-alam.my ialah app sebenar yang dihoskan begini.",

    convertLabel: "Tukar ke PDF",
    mergeLabel: "Gabung PDF",

    seeItLive: "Cuba lihat sendiri",
    sampleHint: "Seret jalur palang pada dokumen contoh — beginilah rasa editor sebenar.",
    misuseA: "Salinan tanpa palang boleh disalahguna.",
    misuseB: "Bank, pejabat kerajaan dan syarikat lazimnya minta salinan berpalang sebelum apa-apa dikongsi.",

    startTitle: "Mula menggunakan Palang",
    startBody: "Percuma dan sumber terbuka — tiada akaun, tiada token, tiada had. Dokumen anda tidak pernah meninggalkan peranti.",
    startFree: "Percuma selamanya",
    startSoon: "Menyusul",

    questions: "Soalan lazim",
    faq1q: "Adakah fail saya dimuat naik?",
    faq1a:
      "Tidak. Keseluruhan saluran paip — penukaran, setem, gabungan — berjalan di dalam pelayar anda. Satu-satunya permintaan rangkaian ialah semakan versi kecil untuk kemas kini.",
    faq2q: "Adakah output fail PDF yang sah?",
    faq2a: "Ya. Fail dihasilkan secara setempat sebagai PDF piawai, boleh dibuka oleh mana-mana pembaca.",
    faq3q: "Betulkah ia sumber terbuka?",
    faq3a: "Berlesen MIT. App web dan enjin rujukan kedua-duanya awam di GitHub — audit atau jalankan sendiri.",
    faq4q: "Bagaimana kemas kini berfungsi?",
    faq4a: "App membandingkan manifest versi apabila dibuka dan menawarkan kemas kini. Binaan asli akan menggunakan semakan yang sama.",

    mitLicense: "Lesen MIT",
    coreEngine: "Enjin teras",
    webApp: "App web",
    networkActivity: "Aktiviti rangkaian",
    noRequestsYet: "Belum ada permintaan rangkaian — semuanya berjalan pada peranti anda.",
    networkIntro: "Permintaan yang dibuat oleh app dalam sesi ini (bukti privasi):",
    updateAvailable: "Terdapat versi baharu (v{version}).",
    updateNow: "Kemas kini sekarang",
    later: "Nanti",
  },
};

/** Whether this instance is served from a remote host (the developer's live
 *  site) as opposed to a self-hosted/local copy. Processing is on-device in
 *  both cases; this only changes the honesty of the network claims. Override
 *  with ?mode=hosted|self for testing. */
export const hosted = detectHosted();

function detectHosted() {
  if (typeof location === "undefined") return false;
  const mode = new URLSearchParams(location.search).get("mode");
  if (mode === "hosted") return true;
  if (mode === "self") return false;
  if (location.protocol === "file:") return false;
  const h = location.hostname;
  return !(h === "" || h === "localhost" || h === "127.0.0.1" || h.endsWith(".local"));
}

export function t(key, vars) {
  const table = DICT[app.lang] ?? DICT.en;
  let text = table[key] ?? DICT.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, String(v));
  }
  return text;
}

/** The language to switch to next (toggle button shows the target). */
export function nextLang() {
  return app.lang === "en" ? "ms" : "en";
}
