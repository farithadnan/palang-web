<script>
  /** Privacy page (#/privacy) — the single privacy destination for the site.
   *  The claims describe the INSTALLED apps (on-device engine, nothing
   *  uploaded) and this static website. No consent gate, no hosted-server
   *  wording: there is no hosted web app. */
  import Icon from "../ui/Icon.svelte";
  import { t } from "../../lib/i18n.js";
  import { GITHUB_URL, ISSUES_URL } from "../../lib/links.js";

  const POINTS = [
    { strong: "private1a", rest: "private1b" },
    { strong: "private2a", rest: "private2b" },
    { strong: "private4a", rest: "private4b" },
    { strong: "private5a", rest: "private5b" },
  ];
</script>

<article class="site-page">
  <a class="site-back" href="#/home">← {t("backHome")}</a>
  <h1>{t("privacyTitle")}</h1>
  <p class="site-lede">{t("privacyLede")}</p>

  <h2 class="site-h2">{t("privateByConstruction")}</h2>
  <ul class="site-points">
    {#each POINTS as p (p.strong)}
      <li><Icon name="shield" size={18} /> <span><strong>{t(p.strong)}</strong> {t(p.rest)}</span></li>
    {/each}
  </ul>

  <h2 class="site-h2">{t("privacyOpen")}</h2>
  <p class="site-note">{t("privacyOpenBody")}</p>

  <h2 class="site-h2">{t("networkActivity")}</h2>
  <p class="site-note">{t("privacySite")}</p>

  <p class="pp-links">
    <a class="link" href={GITHUB_URL} target="_blank" rel="noopener">{t("viewGitHub")}</a>
    <span class="footdot">·</span>
    <a class="link" href={ISSUES_URL} target="_blank" rel="noopener">{t("privacyContact")}</a>
  </p>
  <p class="site-note">{t("mitLicense")} · Palang</p>
</article>

<style>
  .pp-links { display: flex; gap: 0.6rem; align-items: center; margin: 2.2rem 0 0.4rem; }
</style>
