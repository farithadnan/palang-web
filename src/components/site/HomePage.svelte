<script>
  /** Site home: what it is, what it does (each feature has its own page), how
   *  it works, where to get it. Clean and short by design. */
  import Icon from "../ui/Icon.svelte";
  import { t } from "../../lib/i18n.js";
  import { GITHUB_URL, RELEASES_URL } from "../../lib/links.js";

  const FEATURES = [
    { id: "convert", icon: "convert", title: "featConvertTitle", body: "featureConvertBody" },
    { id: "palang", icon: "palang", title: "featPalangTitle", body: "featurePalangBody" },
    { id: "merge", icon: "merge", title: "featMergeTitle", body: "featureMergeBody" },
  ];

  const STEPS = [
    { title: "step1", body: "step1B" },
    { title: "step2", body: "step2B" },
    { title: "step3", body: "step3B" },
  ];

  const DOWNLOADS = [
    { key: "dlWin", desc: "dlWinDesc" },
    { key: "dlApk", desc: "dlApkDesc" },
  ];
</script>

<section class="site-hero">
  <p class="hero-badge">{t("badge")}</p>
  <span class="hero-mark" aria-hidden="true">
    <span class="hero-line"></span>
    <span class="hero-marktext">UNTUK&nbsp;KEGUNAAN&nbsp;RASMI</span>
    <span class="hero-line"></span>
  </span>
  <h1>{t("title")}</h1>
  <p class="hero-lede">{t("lede")}</p>
  <div class="hero-cta">
    <a class="btn btn-primary btn-lg" href="#/install">{t("getTheApp")}</a>
    <a class="btn btn-ghost btn-lg" href={GITHUB_URL} target="_blank" rel="noopener">{t("viewGitHub")}</a>
  </div>
</section>

<div class="site-page">
  <h2 class="site-h2" id="features">{t("whatItDoes")}</h2>
  <ul class="site-rows">
    {#each FEATURES as f (f.id)}
      <li>
        <a class="site-row-link" href={"#/features/" + f.id}>
          <span class="row-icon"><Icon name={f.icon} size={20} /></span>
          <span class="site-row-main">
            <b>{t(f.title)}</b>
            <span>{t(f.body)}</span>
          </span>
          <Icon name="chevR" size={18} class="site-chev" />
        </a>
      </li>
    {/each}
  </ul>

  <h2 class="site-h2" id="how">{t("howWorks")}</h2>
  <ol class="site-steps">
    {#each STEPS as s (s.title)}
      <li>
        <div>
          <h3>{t(s.title)}</h3>
          <p>{t(s.body)}</p>
        </div>
      </li>
    {/each}
  </ol>

  <h2 class="site-h2" id="download">{t("dlTitle")}</h2>
  <p class="site-lede">{t("dlSub")}</p>
  <ul class="site-rows">
    {#each DOWNLOADS as d (d.key)}
      <li>
        <span class="site-row-main">
          <b>{t(d.key + "Name")}</b>
          <span>{t(d.desc)}</span>
        </span>
        <a class="btn btn-sm btn-primary" href={RELEASES_URL} target="_blank" rel="noopener">{t("dlGet")}</a>
      </li>
    {/each}
  </ul>
  <p class="site-note">{t("dlNote")}</p>
  <p><a class="link" href="#/install">{t("installTitle")}</a></p>
</div>

<style>
  .site-hero {
    padding: clamp(3rem, 9vh, 6rem) 1.4rem 2.6rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    background:
      radial-gradient(ellipse 70% 55% at 50% -8%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 70%),
      var(--bg);
  }
  .hero-mark {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.55rem;
    margin: 0 0 1.6rem;
    animation: mark-float 5s ease-in-out infinite;
  }
  @media (prefers-reduced-motion: reduce) { .hero-mark { animation: none; } }
  @keyframes mark-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }
  .hero-line {
    width: clamp(180px, 26vw, 300px);
    height: 3px;
    border-radius: 3px;
    background: linear-gradient(90deg, transparent, var(--accent), transparent);
  }
  .hero-marktext {
    font-weight: 800;
    letter-spacing: 0.28em;
    font-size: clamp(0.9rem, 2.2vw, 1.25rem);
    color: var(--accent);
  }
  .hero-badge {
    display: inline-block;
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 0.35rem 0.9rem;
    margin: 0 0 2.2rem;
  }
  h1 {
    font-size: clamp(2.1rem, 6vw, 3.4rem);
    line-height: 1.08;
    margin: 0 0 1.1rem;
    letter-spacing: -0.02em;
  }
  .hero-lede {
    max-width: 560px;
    margin: 0 auto 2.2rem;
    color: var(--muted);
    font-size: clamp(1rem, 2vw, 1.15rem);
    line-height: 1.6;
  }
  .hero-cta { display: flex; gap: 0.8rem; flex-wrap: wrap; justify-content: center; }
  .btn-lg { padding: 0.75rem 1.5rem; font-size: 1rem; }
  .btn-ghost {
    background: transparent;
    border: 1px solid var(--line);
    color: var(--text);
    font-weight: 700;
    text-decoration: none;
  }
  .btn-ghost:hover { border-color: var(--accent); color: var(--accent); }
  .row-icon {
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
</style>
