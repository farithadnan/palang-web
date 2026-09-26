<script>
  /** Site home. Deliberately SHORT: hero (with the interactive marking sample as
   *  the hero visual) and one row per feature, each linking to its own page.
   *  Nothing else — no stacked sections repeating what those pages say. */
  import Icon from "../ui/Icon.svelte";
  import SampleDemo from "../SampleDemo.svelte";
  import { t } from "../../lib/i18n.js";
  import { GITHUB_URL } from "../../lib/links.js";
  import { href } from "../../lib/router.js";

  const FEATURES = [
    { id: "convert", icon: "convert", title: "featConvertTitle", body: "featureConvertBody" },
    { id: "palang", icon: "palang", title: "featPalangTitle", body: "featurePalangBody" },
    { id: "merge", icon: "merge", title: "featMergeTitle", body: "featureMergeBody" },
  ];
</script>

<svelte:head>
  <title>{t("home")} | Palang</title>
</svelte:head>

<section class="site-hero">
  <div class="hero-inner">
    <div class="hero-main">
      <h1>
        <span class="hero-name">Palang</span>
        <span class="hero-text">{t("title")}</span>
      </h1>
      <p class="hero-tagline">{t("heroTagline")}</p>
      <div class="hero-actions">
        <a class="btn btn-primary btn-lg" href={href("install")}>{t("getTheApp")}</a>
        <a class="btn btn-ghost btn-lg" href={GITHUB_URL} target="_blank" rel="noopener">
          {t("viewGitHub")}
        </a>
      </div>
    </div>
    <div class="hero-visual">
      <SampleDemo />
      <p class="hero-hint">{t("seeItInAction")}</p>
    </div>
  </div>
</section>

<div class="site-page">
  <ul class="site-rows">
    {#each FEATURES as f (f.id)}
      <li>
        <a class="site-row-link" href={href("features/" + f.id)}>
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
</div>

<style>
  .site-hero {
    padding: calc(64px + 4rem) 1.5rem 3.5rem;
    background:
      radial-gradient(ellipse 60% 50% at 50% 0%, color-mix(in srgb, var(--accent) 10%, transparent), transparent 70%),
      var(--bg);
  }
  .hero-inner {
    max-width: 1152px;
    margin: 0 auto;
    display: grid;
    gap: 2.5rem;
    align-items: center;
    text-align: center;
  }
  @media (min-width: 900px) {
    .hero-inner {
      grid-template-columns: minmax(0, 592px) 1fr;
      text-align: left;
    }
  }
  .hero-main { min-width: 0; }
  h1 { margin: 0; }
  .hero-name,
  .hero-text {
    display: block;
    font-size: clamp(2rem, 5vw, 3rem);
    line-height: 1.17;
    font-weight: 700;
    letter-spacing: -0.02em;
  }
  .hero-name { color: var(--accent); }
  .hero-tagline {
    font-size: clamp(1.15rem, 2.4vw, 1.4rem);
    line-height: 1.35;
    font-weight: 500;
    color: var(--muted);
    margin: 1.1rem 0 2rem;
    max-width: 32rem;
  }
  .hero-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; justify-content: center; }
  @media (min-width: 900px) { .hero-actions { justify-content: flex-start; } }
  .hero-visual { display: flex; flex-direction: column; align-items: center; gap: 0.7rem; }
  .hero-visual :global(.samplewrap) { width: min(300px, 100%); }
  .hero-visual :global(.sampletools) { justify-content: center; }
  .hero-hint { margin: 0; font-size: 0.8125rem; color: var(--muted); }
  .row-icon {
    flex: 0 0 auto;
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    background: var(--accent-soft);
    color: var(--accent);
  }
</style>
