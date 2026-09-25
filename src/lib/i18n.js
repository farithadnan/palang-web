/**
 * Minimal i18n: flat key dictionaries for en + ms, read through a language
 * source bound by the store (see __bindLang). Templates read t() during
 * render, so reading the reactive lang through the getter keeps re-rendering
 * working on switch. Missing keys fall back to the English value, so a key
 * left untranslated never renders garbage.
 *
 * Deliberately imports NOTHING from the store: the store imports t() from
 * here for its toasts, so i18n must stay cycle-free (a store <-> i18n cycle
 * breaks in the bundled module order with "t is not defined" at boot).
 */
let langOf = () => "ms";
/** Store-only: bind the reactive language getter (called once at store init). */
export function __bindLang(get) {
  langOf = get;
}

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
    proveThird:
      "Open the app, process a document, then open Network activity in the footer — the panel lists every request the app makes. On this third-party copy you will only ever see the version check and static app files: nothing about your documents leaves this device.",
    proveSelf:
      "Open the app, process a document, then open Network activity in the footer — the panel lists every request the app makes. On your own copy the list stays empty: nothing is ever sent anywhere.",
    verify: "Verify",

    faq5q: "Why does my photo have a white border in the PDF?",
    faq5a:
      "Palang places each page onto the page size you chose (A4 by default) and fits the image inside it — the same way banks and offices expect copies. The preview shows exactly this. To fill the page instead, crop the photo or pick a smaller page size.",

    devTitle: "For developers",
    devWebLink:
      "1 · palang-web — the app (Svelte 5)",
    devWebBody:
      "The Svelte 5 app. Its engine (pdf-lib) runs in the browser, so development needs no server. npm run build:app builds the tools without the landing page.",

    convertLabel: "Convert to PDF",
    mergeLabel: "Merge PDFs",

    // ---- Tool views (Convert / Palang / Merge) ----
    cancel: "Cancel",
    pagePrev: "Previous page",
    pageNext: "Next page",

    cvTitle: "Convert images to PDF",
    cvIntro:
      "Turn one or more photos or scans into a single PDF. Each photo becomes one page, and you can crop or enhance each one on its own.",
    cvChoose: "Choose images to convert",
    cvPageOwn: "Each photo becomes a full page at its own size.",
    cvPageFit: "Each photo becomes one page in this size — the thumbnails show the proportion.",
    cvPaperSize: "Paper size",
    cvImprove: "Improve quality",
    cvImproveHint:
      "Sharpen and boost contrast, good for scans. The preview is approximate — the final enhance runs in the browser when you convert.",
    cvEmpty: "No photos added yet",
    cvPrev: "Previous photo",
    cvNext: "Next photo",
    cvRemoveConfirm: "Remove this photo from the list? This cannot be undone.",
    cvSaved: "Saved — the photo now shows what was applied.",
    cvUndone: "Undone — back to the original photo.",
    cvReplaced: "File replaced.",

    mgIntro:
      "Combine several PDFs into one, in the order you choose. The preview shows the whole merged output — page through every file.",
    mgChoose: "Choose PDFs to merge",
    mgPickHint: "Pick the files — the result follows the order in the list, which you can rearrange",
    mgEmpty: "No PDFs added yet",
    mgAddMore: "Add more PDFs",
    mgRendering: "Rendering page",
    mgNoPreview: "This page can't be previewed — it will still be merged as-is.",
    mgPrevUnavail: "preview unavailable",
    mgSummary: "{n} PDF{s} → one file",

    plTitle: "Add a palang watermark",
    plChoose: "Choose a document to stamp",
    plPosTitle: "Position your marking",
    plPreparing: "Preparing document",
    plPreparingEll: "Preparing…",
    plStillPreparing: "Still preparing your document… large files can take a little longer.",
    plStamp: "Stamp PDF",
    plWorking: "Working…",
    plReadyToast: "Marking ready — stamp the PDF when you're done.",
    plChooseOther: "Choose another file",
    plTryAgain: "Try again",
    plUnable: "Unable to prepare this document. It may be too large or unsupported.",

    basketAddMore: "Add more files",
    basketChoose: "Choose files",
    basketAdd: "Add",
    basketEdit: "Edit",
    basketRemove: "Remove",
    selSelectAll: "Select all",
    selCount: "{n} selected",
    delete: "Delete",
    olUp: "Move up",
    olDown: "Move down",
    olEmpty: "Nothing here yet.",
    specColour: "Colour",
    specPurpose: "Purpose text",
    presetLabel: "Quick phrase",
    presetPlaceholder: "Pick a phrase…",
    tabsAria: "Tools",
    addFiles: "Add files",
    themeLight: "Light",
    themeDark: "Dark",
    updateToast: "Update v{version} is available.",
    about: "About",
    aboutVersion: "Version",
    aboutDate: "Build",
    aboutChannel: "Channel",
    aboutLicense: "License",
    aboutWebsite: "Website",
    aboutGithub: "Source",
    aboutIssues: "Feedback",
    aboutIssuesLink: "Report an issue on GitHub",
    aboutCheckUpdate: "Check for updates",
    aboutChecking: "Checking…",
    settings: "Settings",
    updateFreq: "Update check",
    freqDaily: "Daily",
    freqWeekly: "Weekly",
    freqOff: "Off",
    viewCrop: "Crop",
    viewEnhance: "Enhance",
    close: "Close",
    aboutNote: "All processing happens on this device. Nothing is uploaded, nothing is stored on a server.",
    cbCropArea: "Crop area",
    resizeTL: "Resize top-left",
    resizeTR: "Resize top-right",
    resizeBL: "Resize bottom-left",
    resizeBR: "Resize bottom-right",
    resizeLeft: "Resize left edge",
    resizeRight: "Resize right edge",
    resizeTop: "Resize top edge",
    resizeBottom: "Resize bottom edge",
    pcPagePreview: "Page preview",
    pcPageSurface: "Page preview surface",
    pcLine: "Palang line marking",
    pcMarking: "Palang marking",
    pcReset: "Reset marking position to the middle",
    pcRotate: "Rotate the marking",
    pcScale: "Scale the marking",
    pcWhole: "Show the whole image",
    pcResizeH: "Resize marking height",

    sdBigger: "Bigger",
    sdSmaller: "Smaller",
    sdAria: "Interactive Palang sample document",

    msgMaxImages: "Maximum {n} photos per session.",
    msgOverMb: "{name} is over the {n} MB limit.",
    msgMaxFiles: "Maximum {n} files per document.",
    msgOverflow: "More than {n} pages — the overflow was dropped.",
    msgAddFirst: "Add the files you want to process first.",
    msgPurpose: "Add the purpose text for the bar.",
    dlReady: "Done — {name} is downloading (check your Downloads folder).",

    // ---- Developer guide page (route #/docs) + slim landing dev section ----
    devSlim: "One repository — the app (Svelte 5). Its engine runs in the browser; nothing else ships.",
    devCTA: "Open the developer guide",
    docTitle: "Developer guide",
    docRepos: "Repository",
    docRepo: "the app (Svelte 5) — the whole product; its engine (pdf-lib) runs in the browser",
    docDev: "Local development",
    docVariants: "Build variants",
    docRun: "Run",
    docShips: "Ships",
    docVarFull: "landing page + app (the marketing site)",
    docVarApp: "tools only, no landing page — Docker, EXE, APK, private hosting",
    docConfig: "Configuration",
    docConfigBody:
      "One dotenv source: .env.production holds the committed defaults, .env.local (gitignored) holds your overrides (e.g. a staging domain).",
    docMode: "?mode=hosted|third|self on any page previews the deployment wording.",
    docLimits: "Runtime operator caps live in public/limits.json — adjustable without a rebuild.",
    docEngine: "Engine",
    docEngineA:
      "Everything runs on the device: the PDF engine (pdf-lib) executes in the browser. Convert, stamp and merge never leave it.",
    docEngineB:
      "The same bundle powers the website, Docker, the EXE and the APK — one engine, identical output everywhere.",
    docEngineC:
      "Servers never do the work: static hosts and the Docker image only serve files; processing is always on the visitor's device.",
    docDocker: "Docker",
    docDockerBody:
      "One image: nginx serving the app-only build. Only needed when you want to run it yourself — any static host is a free alternative.",
    docDockerLimits:
      "Override limits.json without rebuilding: docker run -p 8000:80 -v ./limits.json:/usr/share/nginx/html/limits.json:ro palang-web",
    docHosting: "Hosting",
    docHostingBody:
      "Both variants are plain static files — they run free on Vercel, Cloudflare Pages or any static host, because all processing happens in the visitor's browser.",
    docPackaging: "EXE & APK pipeline",
    docPackBody:
      "Tag a release and CI builds everything — the workflows run on GitHub Actions (Windows runner for the EXE, Android SDK in CI for the APK), nothing to install locally.",
    docPackExe: "Windows EXE/MSI via Tauri — published to the GitHub release.",
    docPackApk: "Android APK via Capacitor — sideloadable debug-signed artifact.",
    docPlaySign:
      "Play-Store release needs your keystore wired into the signing config (documented in the README).",
    docCi: "CI",
    docCiBody:
      "CI builds both variants, runs the unit tests, and the packaging workflows run on tags only.",

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
    faq3a: "MIT licensed. The web app is public on GitHub — audit the code or run it yourself.",
    faq4q: "How do updates work?",
    faq4a: "The app compares a version manifest when it opens and offers to update. The native builds will use the same check.",

    mitLicense: "MIT License",
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
    proveThird:
      "Buka app, proses satu dokumen, kemudian buka Aktiviti rangkaian di kaki halaman — panel menyenaraikan setiap permintaan yang dibuat oleh app. Pada salinan pihak ketiga ini, anda hanya akan melihat semakan versi dan fail statik app: tiada apa-apa tentang dokumen anda yang meninggalkan peranti ini.",
    proveSelf:
      "Buka app, proses satu dokumen, kemudian buka Aktiviti rangkaian di kaki halaman — panel menyenaraikan setiap permintaan yang dibuat oleh app. Pada salinan anda sendiri, senarai kekal kosong: tiada apa-apa dihantar ke mana-mana.",
    verify: "Semak",

    faq5q: "Mengapa foto saya ada sempadan putih dalam PDF?",
    faq5a:
      "Palang meletakkan setiap halaman pada saiz halaman yang anda pilih (A4 secara lalai) dan memuatkan imej di dalamnya — sama seperti yang bank dan pejabat jangkakan. Pratonton menunjukkan perkara ini dengan tepat. Untuk memenuhi halaman, potong foto atau pilih saiz halaman yang lebih kecil.",

    devTitle: "Untuk pembangun",
    devWebLink:
      "1 · palang-web — app (Svelte 5)",
    devWebBody:
      "App Svelte 5. Enjinnya (pdf-lib) berjalan dalam pelayar, jadi pembangunan tidak memerlukan pelayan. npm run build:app membina alatan tanpa laman landing.",

    convertLabel: "Tukar ke PDF",
    mergeLabel: "Gabung PDF",

    // ---- Paparan alatan (Tukar / Palang / Gabung) ----
    cancel: "Batal",
    pagePrev: "Halaman sebelumnya",
    pageNext: "Halaman seterusnya",

    cvTitle: "Tukar imej kepada PDF",
    cvIntro:
      "Tukar satu atau lebih foto atau imej imbasan kepada satu PDF. Setiap foto menjadi satu halaman, dan anda boleh potong atau cerahkan setiap satu secara berasingan.",
    cvChoose: "Pilih imej untuk ditukar",
    cvPageOwn: "Setiap foto menjadi satu halaman penuh pada saiz asalnya.",
    cvPageFit: "Setiap foto menjadi satu halaman dalam saiz ini — thumbnail menunjukkan perkadaran.",
    cvPaperSize: "Saiz kertas",
    cvImprove: "Tingkatkan kualiti",
    cvImproveHint:
      "Tajamkan dan cerahkan kontras, sesuai untuk imbasan. Pratonton adalah anggaran — pencerahan akhir berjalan dalam pelayar semasa anda menukar.",
    cvEmpty: "Belum ada foto ditambah",
    cvPrev: "Foto sebelumnya",
    cvNext: "Foto seterusnya",
    cvRemoveConfirm: "Buang foto ini dari senarai? Tindakan ini tidak boleh dibatalkan.",
    cvSaved: "Disimpan — foto kini menunjukkan apa yang digunakan.",
    cvUndone: "Dibatalkan — kembali ke foto asal.",
    cvReplaced: "Fail diganti.",

    mgIntro:
      "Gabungkan beberapa PDF menjadi satu, mengikut urutan pilihan anda. Pratonton menunjukkan keseluruhan output gabungan — lihat setiap halaman setiap fail.",
    mgChoose: "Pilih PDF untuk digabung",
    mgPickHint: "Pilih fail — hasil mengikut susunan dalam senarai, yang boleh anda susun semula",
    mgEmpty: "Belum ada PDF ditambah",
    mgAddMore: "Tambah lebih PDF",
    mgRendering: "Memaparkan halaman",
    mgNoPreview: "Halaman ini tidak dapat dipratonton — ia tetap akan digabung seperti asal.",
    mgPrevUnavail: "pratonton tidak tersedia",
    mgSummary: "{n} PDF → satu fail",

    plTitle: "Tambah tanda palang",
    plChoose: "Pilih dokumen untuk dicap",
    plPosTitle: "Letakkan tanda anda",
    plPreparing: "Menyediakan dokumen",
    plPreparingEll: "Menyediakan…",
    plStillPreparing: "Masih menyediakan dokumen anda… fail besar mungkin mengambil masa lebih lama.",
    plStamp: "Cap PDF",
    plWorking: "Sedang…",
    plReadyToast: "Tanda sedia — cap PDF apabila anda selesai.",
    plChooseOther: "Pilih fail lain",
    plTryAgain: "Cuba lagi",
    plUnable: "Tidak dapat menyediakan dokumen ini. Ia mungkin terlalu besar atau tidak disokong.",

    basketAddMore: "Tambah lebih fail",
    basketChoose: "Pilih fail",
    basketAdd: "Tambah",
    basketEdit: "Sunting",
    basketRemove: "Buang",
    selSelectAll: "Pilih semua",
    selCount: "{n} dipilih",
    delete: "Padam",
    olUp: "Naikkan",
    olDown: "Turunkan",
    olEmpty: "Tiada apa-apa lagi.",
    specColour: "Warna",
    specPurpose: "Teks tujuan",
    presetLabel: "Frasa pantas",
    presetPlaceholder: "Pilih frasa…",
    tabsAria: "Alatan",
    addFiles: "Tambah fail",
    themeLight: "Cerah",
    themeDark: "Gelap",
    updateToast: "Kemas kini v{version} tersedia.",
    about: "Perihal",
    aboutVersion: "Versi",
    aboutDate: "Binaan",
    aboutChannel: "Saluran",
    aboutLicense: "Lesen",
    aboutWebsite: "Laman web",
    aboutGithub: "Sumber",
    aboutIssues: "Maklum balas",
    aboutIssuesLink: "Laporkan isu di GitHub",
    aboutCheckUpdate: "Semak kemas kini",
    aboutChecking: "Menyemak…",
    settings: "Tetapan",
    updateFreq: "Semakan kemas kini",
    freqDaily: "Harian",
    freqWeekly: "Mingguan",
    freqOff: "Mati",
    viewCrop: "Potong",
    viewEnhance: "Cerah",
    close: "Tutup",
    aboutNote: "Semua pemprosesan berlaku pada peranti ini. Tiada apa yang dimuat naik, tiada apa yang disimpan pada pelayan.",
    cbCropArea: "Kawasan potong",
    resizeTL: "Ubah saiz kiri atas",
    resizeTR: "Ubah saiz kanan atas",
    resizeBL: "Ubah saiz kiri bawah",
    resizeBR: "Ubah saiz kanan bawah",
    resizeLeft: "Ubah saiz tepi kiri",
    resizeRight: "Ubah saiz tepi kanan",
    resizeTop: "Ubah saiz tepi atas",
    resizeBottom: "Ubah saiz tepi bawah",
    pcPagePreview: "Pratonton halaman",
    pcPageSurface: "Permukaan pratonton halaman",
    pcLine: "Tanda garisan palang",
    pcMarking: "Tanda palang",
    pcReset: "Tetapkan semula tanda ke tengah",
    pcRotate: "Putar tanda",
    pcScale: "Skala tanda",
    pcWhole: "Tunjukkan keseluruhan imej",
    pcResizeH: "Ubah saiz ketinggian tanda",

    sdBigger: "Besar",
    sdSmaller: "Kecil",
    sdAria: "Dokumen sampel palang interaktif",

    msgMaxImages: "Maksimum {n} foto setiap sesi.",
    msgOverMb: "{name} melebihi had {n} MB.",
    msgMaxFiles: "Maksimum {n} fail setiap dokumen.",
    msgOverflow: "Lebih daripada {n} halaman — lebihan digugurkan.",
    msgAddFirst: "Tambah fail yang anda mahu proses terlebih dahulu.",
    msgPurpose: "Tambah teks tujuan untuk bar.",
    dlReady: "Selesai — {name} sedang dimuat turun (semak folder Muat Turun anda).",

    seeItLive: "Cuba lihat sendiri",

    // ---- Halaman panduan pembangun (laluan #/docs) + bahagian dev yang ringkas ----
    devSlim: "Satu repositori — app (Svelte 5). Enjinnya berjalan dalam pelayar; tiada apa-apa lagi yang dihantar.",
    devCTA: "Buka panduan pembangun",
    docTitle: "Panduan pembangun",
    docRepos: "Repositori",
    docRepo: "app (Svelte 5) — keseluruhan produk; enjinnya (pdf-lib) berjalan dalam pelayar",
    docDev: "Pembangunan tempatan",
    docVariants: "Varian binaan",
    docRun: "Jalankan",
    docShips: "Dihantar",
    docVarFull: "laman landing + app (laman pemasaran)",
    docVarApp: "alatan sahaja, tanpa laman landing — Docker, EXE, APK, pengehosan persendirian",
    docConfig: "Konfigurasi",
    docConfigBody:
      "Satu sumber dotenv: .env.production menyimpan lalai yang dikomit, .env.local (tidak dalam git) untuk overriding anda (cth. domain pentas).",
    docMode: "?mode=hosted|third|self pada mana-mana halaman mempratonton teks pengehosan.",
    docLimits: "Had pengendali masa jalan ada dalam public/limits.json — boleh ubah tanpa binaan semula.",
    docEngine: "Enjin",
    docEngineA:
      "Semua berjalan pada peranti: enjin PDF (pdf-lib) berjalan dalam pelayar. Tukar, cap dan gabung tidak pernah meninggalkannya.",
    docEngineB:
      "Bundle yang sama menggerakkan laman web, Docker, EXE dan APK — satu enjin, output yang sama di mana-mana.",
    docEngineC:
      "Pelayan tidak pernah melakukan kerja: hos statik dan imej Docker hanya menyajikan fail; pemprosesan sentiasa pada peranti pelawat.",
    docDocker: "Docker",
    docDockerBody:
      "Satu imej: nginx menyajikan binaan app sahaja. Hanya diperlukan jika anda mahu menjalankan sendiri — mana-mana hos statik adalah alternatif percuma.",
    docDockerLimits:
      "Ubah limits.json tanpa binaan semula: docker run -p 8000:80 -v ./limits.json:/usr/share/nginx/html/limits.json:ro palang-web",
    docHosting: "Pengehosan",
    docHostingBody:
      "Kedua-dua varian ialah fail statik biasa — berjalan percuma di Vercel, Cloudflare Pages atau mana-mana hos statik, kerana semua pemprosesan berlaku dalam pelayar pelawat.",
    docPackaging: "Saluran EXE & APK",
    docPackBody:
      "Tag satu release dan CI membina segala-galanya — aliran kerja berjalan di GitHub Actions (runner Windows untuk EXE, SDK Android dalam CI untuk APK), tiada perlu pasang tempatan.",
    docPackExe: "EXE/MSI Windows melalui Tauri — diterbitkan ke release GitHub.",
    docPackApk: "APK Android melalui Capacitor — artifak debug-signed boleh dipasang.",
    docPlaySign:
      "Release Play Store perlukan keystore anda dalam konfigurasi tanda tangan (didokumenkan dalam README).",
    docCi: "CI",
    docCiBody:
      "CI membina kedua-dua varian, menjalankan ujian unit, dan aliran kerja pembungkusan hanya berjalan pada tag.",

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
    faq3a: "Berlesen MIT. App web awam di GitHub — audit kod atau jalankan sendiri.",
    faq4q: "Bagaimana kemas kini berfungsi?",
    faq4a: "App membandingkan manifest versi apabila dibuka dan menawarkan kemas kini. Binaan asli akan menggunakan semakan yang sama.",

    mitLicense: "Lesen MIT",
    networkActivity: "Aktiviti rangkaian",
    noRequestsYet: "Belum ada permintaan rangkaian — semuanya berjalan pada peranti anda.",
    networkIntro: "Permintaan yang dibuat oleh app dalam sesi ini (bukti privasi):",
    updateAvailable: "Terdapat versi baharu (v{version}).",
    updateNow: "Kemas kini sekarang",
    later: "Nanti",
  },
};

export { hostUrl, deployKind } from "./site-config.js";

export function t(key, vars) {
  const table = DICT[langOf()] ?? DICT.en;
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
