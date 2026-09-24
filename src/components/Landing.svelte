<script>
  /** Landing page: what Palang is, why offline, how to get it, who makes it.
   *  Full-screen view (no app chrome) with the SHARED top bar; the privacy
   *  section here is the single privacy destination (footers + app point
   *  at #privacy). Copy is i18n'd (en/ms). */
  import Topbar from "./ui/Topbar.svelte";
  import Modal from "./ui/Modal.svelte";
  import SampleDemo from "./SampleDemo.svelte";
  import Icon from "./ui/Icon.svelte";
  import { t } from "../lib/i18n.js";

  const PLATFORMS = [
    { key: "platformWeb", status: "liveNow", action: "convert" },
    { key: "platformApk", status: "soon", action: null },
    { key: "platformExe", status: "soon", action: null },
  ];

  const FEATURES = [
    { icon: "convert", title: "featureConvert", body: "featureConvertBody" },
    { icon: "palang", title: "featurePalang", body: "featurePalangBody" },
    { icon: "merge", title: "featureMerge", body: "featureMergeBody" },
    { icon: "shield", title: "featurePrivate", body: "featurePrivateBody" },
  ];

  const STEPS = [
    { n: "1", title: "step1", body: "step1B" },
    { n: "2", title: "step2", body: "step2B" },
    { n: "3", title: "step3", body: "step3B" },
  ];

  const PRIVATE = [
    { strong: "private1a", rest: "private1b" },
    { strong: "private2a", rest: "private2b" },
    { strong: "private3a", rest: "private3b" },
    { strong: "private4a", rest: "private4b" },
    { strong: "private5a", rest: "private5b" },
  ];

  const FAQS = [
    { q: "faq1q", a: "faq1a" },
    { q: "faq2q", a: "faq2a" },
    { q: "faq3q", a: "faq3a" },
    { q: "faq4q", a: "faq4a" },
  ];

  function go(view) {
    location.hash = "#/" + view;
  }

  let startOpen = $state(false);
  function openApp() {
    startOpen = true;
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
  <title>Palang — {t("title")}</title>
  <meta name="description" content={t("lede")} />
</svelte:head>

<div class="landing">
  <Topbar context="landing" onOpenApp={openApp}>
    {#snippet children()}
      <a href="#features" onclick={(e) => jump("#features", e)}>{t("features")}</a>
      <a href="#how" onclick={(e) => jump("#how", e)}>{t("how")}</a>
      <a href="#privacy" onclick={(e) => jump("#privacy", e)}>{t("privacy")}</a>
      <a href="#verify" onclick={(e) => jump("#verify", e)}>{t("verify")}</a>
      <a href="#faq" onclick={(e) => jump("#faq", e)}>{t("faq")}</a>
    {/snippet}
  </Topbar>

  <section class="ld-hero" id="home">
    <p class="ld-badge">{t("badge")}</p>
    <span class="ld-hero-mark" aria-hidden="true">
      <span class="ld-mark-line"></span>
      <span class="ld-mark-text">UNTUK&nbsp;KEGUNAAN&nbsp;RASMI</span>
      <span class="ld-mark-line"></span>
    </span>
    <h1>{t("title")}</h1>
    <p class="ld-lede">{t("lede")}</p>
    <div class="ld-cta">
      <button type="button" class="btn btn-primary btn-lg" onclick={openApp}>{t("openWebApp")}</button>
      <a class="btn btn-ghost btn-lg" href="https://github.com/farithadnan/palang" target="_blank" rel="noopener">{t("viewGitHub")}</a>
    </div>
    <p class="ld-misuse">
      <b>{t("misuseA")}</b> {t("misuseB")}
    </p>
  </section>

  <section class="ld-section ld-sample" id="sample" data-reveal>
    <h2>{t("seeItLive")}</h2>
    <p class="ld-sub">{t("sampleHint")}</p>
    <SampleDemo />
  </section>

  <section class="ld-section" id="platforms" data-reveal>
    <h2>{t("getItOnAnything")}</h2>
    <p class="ld-sub">{t("platformsSub")}</p>
    <ul class="ld-platforms">
      {#each PLATFORMS as p (p.key)}
        <li>
          <div class="ld-pname">
            <b>{t(p.key + "Name")}</b>
            <span class="ld-status" class:soon={p.status === "soon"}>{t(p.status)}</span>
          </div>
          <p>{t(p.key + "Desc")}</p>
          {#if p.action}
            <button type="button" class="btn btn-sm btn-primary" onclick={openApp}>{t("open")}</button>
          {:else}
            <span class="ld-soon">{t("arrivesWithNative")}</span>
          {/if}
        </li>
      {/each}
    </ul>
  </section>

  <section class="ld-section" id="features" data-reveal>
    <h2>{t("whatItDoes")}</h2>
    <p class="ld-sub">{t("featuresSub")}</p>
    <ul class="ld-features">
      {#each FEATURES as f (f.title)}
        <li>
          <span class="ld-feature-icon"><Icon name={f.icon} size={20} /></span>
          <div>
            <h3>{t(f.title)}</h3>
            <p>{t(f.body)}</p>
          </div>
        </li>
      {/each}
    </ul>
  </section>

  <section class="ld-section" id="how" data-reveal>
    <h2>{t("howWorks")}</h2>
    <p class="ld-sub">{t("stepsSub")}</p>
    <ol class="ld-steps">
      {#each STEPS as s (s.n)}
        <li>
          <span class="ld-step-n">{s.n}</span>
          <div>
            <h3>{t(s.title)}</h3>
            <p>{t(s.body)}</p>
          </div>
        </li>
      {/each}
    </ol>
  </section>

  <section class="ld-section ld-privacy" id="privacy" data-reveal>
    <h2>{t("privateByConstruction")}</h2>
    <ul class="ld-plain">
      {#each PRIVATE as p (p.strong)}
        <li><strong>{t(p.strong)}</strong> {t(p.rest)}</li>
      {/each}
    </ul>
  </section>

  <section class="ld-section ld-verify" id="verify" data-reveal>
    <h2>{t("proveIt")}</h2>
    <p class="ld-sub">{t("proveSub")}</p>
    <p class="ld-prove-body">{t("proveBody")}</p>
  </section>

  <section class="ld-section" id="faq" data-reveal>
    <h2>{t("questions")}</h2>
    <ul class="ld-faq">
      {#each FAQS as f (f.q)}
        <li>
          <h3>{t(f.q)}</h3>
          <p>{t(f.a)}</p>
        </li>
      {/each}
    </ul>
  </section>

  <footer class="ld-foot">
    <div class="ld-footrow">
      <button type="button" class="link" onclick={(e) => jump("#privacy", e)}>{t("privacy")}</button>
      <span class="footdot">·</span>
      <span>{t("mitLicense")}</span>
      <span class="footdot">·</span>
      <a class="link" href="https://github.com/farithadnan/palang" target="_blank" rel="noopener">{t("coreEngine")}</a>
      <span class="footdot">·</span>
      <a class="link" href="https://github.com/farithadnan/palang-web" target="_blank" rel="noopener">{t("webApp")}</a>
    </div>
  </footer>
</div>

{#if startOpen}
  <Modal title={t("startTitle")} onClose={() => (startOpen = false)}>
    <p class="desc">{t("startBody")}</p>
    <div class="start-actions">
      <button
        type="button"
        class="btn btn-primary"
        onclick={() => {
          startOpen = false;
          go("convert");
        }}
      >
        {t("openWebApp")}
      </button>
      <button type="button" class="link" onclick={() => jump("#privacy")}>
        {t("privacy")}
      </button>
    </div>
    <div class="divider"></div>
    <ul class="start-list">
      <li>
        <b>{t("platformWebName")}</b>
        <span class="ld-status">{t("liveNow")}</span>
      </li>
      <li>
        <b>{t("platformApkName")}</b>
        <span class="ld-status soon">{t("startSoon")}</span>
      </li>
      <li>
        <b>{t("platformExeName")}</b>
        <span class="ld-status soon">{t("startSoon")}</span>
      </li>
    </ul>
  </Modal>
{/if}

<style>
  .landing {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
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

  .ld-misuse {
    max-width: 560px;
    margin: 1.6rem auto 0;
    color: var(--muted);
    font-size: 0.9rem;
    line-height: 1.5;
  }
  .ld-misuse b { color: var(--text); }

  /* interactive sample */
  .ld-sample .ld-sub { text-align: center; }
  .start-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    margin-top: 0.6rem;
  }
  .start-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }
  .start-list li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
  }

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
    .ld-hero-mark, .brand-mark { animation: none; }
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
  @media (max-width: 640px) {
    /* keep the privacy panel off the screen edges on mobile */
    .ld-privacy {
      padding-left: 1.2rem;
      padding-right: 1.2rem;
    }
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
  .ld-prove-body {
    color: var(--muted);
    line-height: 1.65;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--panel);
    padding: 1.1rem 1.3rem;
    margin: 0;
  }
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
