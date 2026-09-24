<script>
  /** Landing page: what Palang is, why offline, how to get it, who makes it.
   *  Full-screen marketing view (no app chrome); the app opens via CTAs.
   *  Animations: hero mark rhythm, scroll-reveal sections (IntersectionObserver,
   *  respects prefers-reduced-motion). */
  import Icon from "./ui/Icon.svelte";

  const PLATFORMS = [
    { name: "Web app", status: "Live now", desc: "Works in any browser — it's this app, on this page.", action: "convert" },
    { name: "Android APK", status: "Soon", desc: "Installable app, same on-device engine.", action: null },
    { name: "Desktop (EXE)", status: "Soon", desc: "Windows desktop build from the same codebase.", action: null },
  ];

  const FEATURES = [
    {
      icon: "convert",
      title: "Convert",
      body: "Photos into a single PDF — per-image crop and light enhance, your choice of page size, previewed instantly.",
    },
    {
      icon: "palang",
      title: "Palang",
      body: "The bank-purpose band. Drag, rotate and scale it like a real stamp — transparent lines that follow the text, live on the page.",
    },
    {
      icon: "merge",
      title: "Merge",
      body: "Join PDFs in the order you want, straight from your device.",
    },
    {
      icon: "shield",
      title: "Private by construction",
      body: "No accounts, no uploads, no tracking. Every step runs in your browser — your documents never leave your machine.",
    },
  ];

  const STEPS = [
    { n: "1", title: "Add your files", body: "Photos or PDFs from your device." },
    { n: "2", title: "Arrange the marking", body: "Drag the band where it belongs — rotate it, size it, watch it live." },
    { n: "3", title: "Download the PDF", body: "One file ready to share. Nothing was sent anywhere." },
  ];

  const FAQS = [
    { q: "Do my files get uploaded?", a: "No. The whole pipeline — conversion, stamping, merging — runs inside your browser. The only network request is a small version check for updates." },
    { q: "Is the output a real, valid PDF?", a: "Yes. Files are produced locally as standard PDFs, openable by any reader." },
    { q: "Is it really open source?", a: "MIT licensed. The web app and the reference engine are both public on GitHub — audit them or run them yourself." },
    { q: "How do updates work?", a: "The app compares a version manifest when it opens and offers to update. The native builds will use the same check." },
  ];

  function go(view) {
    location.hash = "#/" + view;
  }

  function jump(sel, e) {
    e?.preventDefault();
    document.querySelector(sel)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  $effect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) entry.target.classList.add("in");
      },
      { threshold: 0.12 }
    );
    const els = document.querySelectorAll("[data-reveal]");
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  });
</script>

<svelte:head>
  <title>Palang — prepare documents for sharing, on your device</title>
  <meta
    name="description"
    content="Palang converts photos to PDF, stamps the bank-purpose band, and merges documents — fully offline, open source, MIT licensed."
  />
</svelte:head>

<div class="landing">
  <header class="ld-nav">
    <a class="ld-brand" href="#home" onclick={(e) => jump("#home", e)}>
      <span class="ld-brand-mark" aria-hidden="true"></span>
      <b>Palang</b>
    </a>
    <nav class="ld-links" aria-label="Sections">
      <a href="#features" onclick={(e) => jump("#features", e)}>Features</a>
      <a href="#how" onclick={(e) => jump("#how", e)}>How it works</a>
      <a href="#privacy" onclick={(e) => jump("#privacy", e)}>Privacy</a>
      <a href="#faq" onclick={(e) => jump("#faq", e)}>FAQ</a>
    </nav>
    <button type="button" class="btn btn-sm btn-primary" onclick={() => go("convert")}>Open app</button>
  </header>

  <section class="ld-hero" id="home">
    <p class="ld-badge">Offline · Open source · MIT</p>
    <span class="ld-hero-mark" aria-hidden="true">
      <span class="ld-mark-line"></span>
      <span class="ld-mark-text">BANK&nbsp;SAHAJA</span>
      <span class="ld-mark-line"></span>
    </span>
    <h1>Prepare documents for sharing</h1>
    <p class="ld-lede">
      Palang turns your photos and PDFs into ready-to-share documents —
      convert, stamp the bank-purpose band, merge — all on your device.
      Nothing is uploaded. Ever.
    </p>
    <div class="ld-cta">
      <button type="button" class="btn btn-primary btn-lg" onclick={() => go("convert")}>Open the web app</button>
      <a class="btn btn-ghost btn-lg" href="https://github.com/farithadnan/palang" target="_blank" rel="noopener">View on GitHub</a>
    </div>
  </section>

  <section class="ld-section" id="platforms" data-reveal>
    <h2>Get it on anything</h2>
    <p class="ld-sub">One engine, every surface. Processing stays on your device.</p>
    <ul class="ld-platforms">
      {#each PLATFORMS as p (p.name)}
        <li>
          <div class="ld-pname">
            <b>{p.name}</b>
            <span class="ld-status" class:soon={p.status !== "Live now"}>{p.status}</span>
          </div>
          <p>{p.desc}</p>
          {#if p.action}
            <button type="button" class="btn btn-sm btn-primary" onclick={() => go(p.action)}>Open</button>
          {:else}
            <span class="ld-soon">Arrives with the native build</span>
          {/if}
        </li>
      {/each}
    </ul>
  </section>

  <section class="ld-section" id="features" data-reveal>
    <h2>What it does</h2>
    <p class="ld-sub">Four things, one clean flow — no clutter, no accounts.</p>
    <ul class="ld-features">
      {#each FEATURES as f (f.title)}
        <li>
          <span class="ld-feature-icon"><Icon name={f.icon} size={20} /></span>
          <div>
            <h3>{f.title}</h3>
            <p>{f.body}</p>
          </div>
        </li>
      {/each}
    </ul>
  </section>

  <section class="ld-section" id="how" data-reveal>
    <h2>How it works</h2>
    <ol class="ld-steps">
      {#each STEPS as s (s.n)}
        <li>
          <span class="ld-step-n">{s.n}</span>
          <div>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
          </div>
        </li>
      {/each}
    </ol>
  </section>

  <section class="ld-section ld-privacy" id="privacy" data-reveal>
    <h2>Private by construction</h2>
    <ul class="ld-plain">
      <li><strong>On-device processing.</strong> Conversion, stamping and merging all run in your browser.</li>
      <li><strong>No accounts, no sign-ins, no tracking.</strong> There is nothing to profile.</li>
      <li><strong>Open source.</strong> The entire pipeline is public under MIT — read it, run it, trust it because you can verify it.</li>
      <li><strong>Update checks only.</strong> The sole network request is a small version manifest.</li>
    </ul>
  </section>

  <section class="ld-section" id="faq" data-reveal>
    <h2>Questions</h2>
    <ul class="ld-faq">
      {#each FAQS as f (f.q)}
        <li>
          <h3>{f.q}</h3>
          <p>{f.a}</p>
        </li>
      {/each}
    </ul>
  </section>

  <footer class="ld-foot">
    <div class="ld-footrow">
      <button type="button" class="link" onclick={() => go("privacy")}>Privacy</button>
      <span class="footdot">·</span>
      <span>MIT License</span>
      <span class="footdot">·</span>
      <a class="link" href="https://github.com/farithadnan/palang" target="_blank" rel="noopener">Core engine</a>
      <span class="footdot">·</span>
      <a class="link" href="https://github.com/farithadnan/palang-web" target="_blank" rel="noopener">Web app</a>
    </div>
  </footer>
</div>

<style>
  .landing {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* nav */
  .ld-nav {
    position: sticky;
    top: 0;
    z-index: 20;
    display: flex;
    align-items: center;
    gap: 1.2rem;
    padding: 0.8rem 1.4rem;
    backdrop-filter: blur(10px);
    background: color-mix(in srgb, var(--bg) 82%, transparent);
    border-bottom: 1px solid var(--line);
  }
  .ld-brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.05rem;
    text-decoration: none;
    color: var(--text);
  }
  .ld-brand-mark {
    width: 22px;
    height: 16px;
    background:
      linear-gradient(var(--accent), var(--accent)) 0 1px / 22px 2px no-repeat,
      linear-gradient(var(--accent), var(--accent)) 0 13px / 22px 2px no-repeat;
    border-radius: 2px;
    animation: mark-pulse 3.2s ease-in-out infinite;
  }
  @keyframes mark-pulse {
    0%, 100% { opacity: 1; transform: scaleX(1); }
    50% { opacity: 0.55; transform: scaleX(0.92); }
  }
  .ld-links {
    display: flex;
    gap: 1.1rem;
    margin-left: auto;
  }
  .ld-links a {
    color: var(--muted);
    text-decoration: none;
    font-size: 0.92rem;
    font-weight: 600;
  }
  .ld-links a:hover { color: var(--text); }
  @media (max-width: 640px) {
    .ld-links { display: none; }
    .ld-nav { padding: 0.7rem 1rem; }
  }

  /* hero */
  .ld-hero {
    padding: clamp(3rem, 9vh, 6rem) 1.4rem 4rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    background:
      radial-gradient(ellipse 70% 55% at 50% -8%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 70%),
      var(--bg);
  }
  .ld-hero-mark {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.55rem;
    margin: 0 0 1.6rem;
    animation: mark-float 5s ease-in-out infinite;
  }
  @keyframes mark-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }
  .ld-mark-line {
    width: clamp(180px, 26vw, 300px);
    height: 3px;
    border-radius: 3px;
    background: linear-gradient(90deg, transparent, var(--accent), transparent);
  }
  .ld-mark-text {
    font-weight: 800;
    letter-spacing: 0.28em;
    font-size: clamp(0.9rem, 2.2vw, 1.25rem);
    color: var(--accent);
  }
  .ld-badge {
    display: inline-block;
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 0.35rem 0.9rem;
    margin-bottom: 2.2rem;
  }
  .ld-hero h1 {
    font-size: clamp(2.1rem, 6vw, 3.6rem);
    line-height: 1.08;
    margin: 0 0 1.1rem;
    letter-spacing: -0.02em;
  }
  .ld-lede {
    max-width: 560px;
    margin: 0 auto 2.2rem;
    color: var(--muted);
    font-size: clamp(1rem, 2vw, 1.15rem);
    line-height: 1.6;
  }
  .ld-cta {
    display: flex;
    gap: 0.8rem;
    flex-wrap: wrap;
    justify-content: center;
  }
  .btn-lg { padding: 0.75rem 1.5rem; font-size: 1rem; }
  .btn-ghost {
    background: transparent;
    border: 1px solid var(--line);
    color: var(--text);
    font-weight: 700;
    text-decoration: none;
  }
  .btn-ghost:hover { border-color: var(--accent); color: var(--accent); }

  /* sections */
  .ld-section {
    max-width: 780px;
    margin: 0 auto;
    padding: clamp(2.6rem, 7vh, 4.5rem) 1.4rem;
    width: 100%;
    scroll-margin-top: 72px;
  }
  .ld-section > h2 {
    font-size: clamp(1.5rem, 3.5vw, 2rem);
    letter-spacing: -0.015em;
    margin: 0 0 0.4rem;
  }
  .ld-sub {
    color: var(--muted);
    margin: 0 0 1.8rem;
  }

  [data-reveal] {
    opacity: 0;
    transform: translateY(18px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }
  [data-reveal].in {
    opacity: 1;
    transform: none;
  }
  @media (prefers-reduced-motion: reduce) {
    [data-reveal] { opacity: 1; transform: none; transition: none; }
    .ld-hero-mark, .ld-brand-mark { animation: none; }
  }

  /* platforms */
  .ld-platforms {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
  }
  .ld-platforms li {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    padding: 1rem 1.2rem;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--panel);
  }
  .ld-platforms li > p { flex: 1; min-width: 180px; color: var(--muted); margin: 0; }
  .ld-pname { display: flex; align-items: center; gap: 0.6rem; min-width: 170px; }
  .ld-status {
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #0a7d3c;
    background: color-mix(in srgb, #0a7d3c 12%, transparent);
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
  }
  .ld-status.soon { color: var(--muted); background: color-mix(in srgb, var(--muted) 12%, transparent); }
  .ld-soon { font-size: 0.85rem; color: var(--muted); }

  /* features (list layout, matching the project's design taste) */
  .ld-features {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
  }
  .ld-features li {
    display: flex;
    gap: 1.1rem;
    padding: 1.1rem 0;
    border-top: 1px solid var(--line);
  }
  .ld-features li:last-child { border-bottom: 1px solid var(--line); }
  .ld-feature-icon {
    flex: 0 0 auto;
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    border: 1px solid var(--line);
    color: var(--accent);
    background: var(--panel);
  }
  .ld-features h3 { margin: 0 0 0.25rem; font-size: 1.05rem; }
  .ld-features p { margin: 0; color: var(--muted); line-height: 1.55; }

  /* steps */
  .ld-steps {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
    counter-reset: none;
  }
  .ld-steps li {
    display: flex;
    gap: 1.1rem;
    align-items: flex-start;
  }
  .ld-step-n {
    flex: 0 0 auto;
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border-radius: 999px;
    font-weight: 800;
    color: var(--accent);
    border: 1px solid var(--accent);
  }
  .ld-steps h3 { margin: 0 0 0.2rem; font-size: 1.05rem; }
  .ld-steps p { margin: 0; color: var(--muted); }

  /* privacy + faq */
  .ld-privacy {
    border: 1px solid var(--line);
    border-radius: 18px;
    padding: clamp(2rem, 5vh, 3rem) 1.6rem;
    background: var(--panel);
    margin-top: clamp(2.6rem, 7vh, 4.5rem);
    margin-bottom: clamp(2.6rem, 7vh, 4.5rem);
  }
  .ld-privacy ul, .ld-faq {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.95rem;
  }
  .ld-plain li { line-height: 1.55; color: var(--muted); }
  .ld-plain strong { color: var(--text); }
  .ld-faq li { border-top: 1px solid var(--line); padding-top: 0.95rem; }
  .ld-faq h3 { margin: 0 0 0.3rem; font-size: 1rem; }
  .ld-faq p { margin: 0; color: var(--muted); line-height: 1.55; }

  /* footer */
  .ld-foot {
    margin-top: auto;
    border-top: 1px solid var(--line);
    padding: 1.1rem 1.4rem;
  }
  .ld-footrow {
    max-width: 780px;
    margin: 0 auto;
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    color: var(--muted);
  }
</style>
