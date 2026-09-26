<script>
  /** One page per notable feature (#/features/convert|palang|merge): what it
   *  does, how to use it, and (for palang) a live sample. */
  import Icon from "../ui/Icon.svelte";
  import SampleDemo from "../SampleDemo.svelte";
  import { t } from "../../lib/i18n.js";

  let { id = "convert" } = $props();

  const PAGES = {
    convert: {
      icon: "convert",
      title: "featConvertTitle",
      lede: "featureConvertBody",
      points: ["featConvertPoint1", "featConvertPoint2", "featConvertPoint3"],
      steps: ["step1", "step2", "step3"],
      stepsBody: ["step1B", "step2B", "step3B"],
      faq: ["faq5q", "faq5a"],
    },
    palang: {
      icon: "palang",
      title: "featPalangTitle",
      lede: "featurePalangBody",
      points: ["featPalangPoint1", "featPalangPoint2", "featPalangPoint3"],
      steps: ["step1", "step2", "step3"],
      stepsBody: ["step1B", "step2B", "step3B"],
      demo: true,
    },
    merge: {
      icon: "merge",
      title: "featMergeTitle",
      lede: "featureMergeBody",
      points: ["featMergePoint1", "featMergePoint2", "featMergePoint3"],
      steps: ["step1", "step2", "step3"],
      stepsBody: ["step1B", "step2B", "step3B"],
    },
  };

  const page = $derived(PAGES[id] ?? PAGES.convert);
</script>

<article class="site-page">
  <a class="site-back" href="#/home">← {t("backHome")}</a>
  <h1>
    <span class="fp-icon"><Icon name={page.icon} size={22} /></span>
    {t(page.title)}
  </h1>
  <p class="site-lede">{t(page.lede)}</p>

  <h2 class="site-h2">{t("whatItDoes")}</h2>
  <ul class="site-points">
    {#each page.points as key (key)}
      <li><Icon name="check" size={18} /> <span>{t(key)}</span></li>
    {/each}
  </ul>

  <h2 class="site-h2">{t("featHowTo")}</h2>
  <ol class="site-steps">
    {#each page.steps as key, i (key)}
      <li>
        <div>
          <h3>{t(key)}</h3>
          <p>{t(page.stepsBody[i])}</p>
        </div>
      </li>
    {/each}
  </ol>

  {#if page.faq}
    <h2 class="site-h2">{t(page.faq[0])}</h2>
    <p class="site-note">{t(page.faq[1])}</p>
  {/if}

  {#if page.demo}
    <h2 class="site-h2">{t("seeItInAction")}</h2>
    <div class="fp-demo"><SampleDemo /></div>
  {/if}

  <p class="fp-cta"><a class="btn btn-primary" href="#/install">{t("getTheApp")}</a></p>
</article>

<style>
  h1 { display: flex; align-items: center; gap: 0.6rem; }
  .fp-icon {
    width: 40px;
    height: 40px;
    flex: 0 0 auto;
    display: grid;
    place-items: center;
    border-radius: 12px;
    border: 1px solid var(--line);
    color: var(--accent);
    background: var(--panel);
  }
  .fp-demo { max-width: 330px; }
  .fp-demo :global(.sampletools) { margin-top: 0.7rem; }
  .fp-demo :global(.sampletools .btn) { padding: 0.3rem 0.7rem; font-size: 0.82rem; }
  .fp-cta { margin-top: 2.4rem; }
</style>
