<script>
  /** Install page: how to get Palang on Windows and Android, requirements, and
   *  the update behaviour. Downloads point at GitHub Releases (honest: no
   *  fake "download" buttons for builds that are not published yet). */
  import Icon from "../ui/Icon.svelte";
  import { t } from "../../lib/i18n.js";
  import { GITHUB_URL, ISSUES_URL, RELEASES_URL } from "../../lib/links.js";
  import { href } from "../../lib/router.js";

  const BUILDS = [
    { key: "dlWin", stepsKey: "installWinSteps", steps: ["installWinStep1", "installWinStep2", "installWinStep3"] },
    { key: "dlApk", stepsKey: "installApkSteps", steps: ["installApkStep1", "installApkStep2", "installApkStep3"] },
  ];
</script>

<svelte:head>
  <title>{t("installTitle")} | Palang</title>
</svelte:head>


<article class="site-page">
  <a class="site-back" href={href("")}>← {t("backHome")}</a>
  <h1>{t("installTitle")}</h1>
  <p class="site-lede">{t("installSub")}</p>

  {#each BUILDS as b (b.key)}
    <section class="inst-build">
      <h2 class="site-h2">{t(b.key + "Name")}</h2>
      <p class="site-note">{t(b.key + "Desc")}</p>
      <ol class="site-steps">
        {#each b.steps as key (key)}
          <li><div><p>{t(key)}</p></div></li>
        {/each}
      </ol>
      <p class="inst-get">
        <a class="btn btn-primary" href={RELEASES_URL} target="_blank" rel="noopener">
          <Icon name="download" size={18} />
          {t("dlGet")}
        </a>
      </p>
      <p class="site-note">{t("dlNote")}</p>
    </section>
  {/each}

  <h2 class="site-h2">{t("installReq")}</h2>
  <p class="site-note">{t("installReqList")}</p>

  <h2 class="site-h2">{t("installUpdates")}</h2>
  <p class="site-note">{t("installUpdatesBody")}</p>

  <p class="inst-help">
    <a class="link" href={ISSUES_URL} target="_blank" rel="noopener">{t("privacyContact")}</a>
    <span class="footdot">·</span>
    <a class="link" href={GITHUB_URL} target="_blank" rel="noopener">GitHub</a>
  </p>
</article>

<style>
  .inst-build { border-top: 1px solid var(--line); padding-top: 1.2rem; }
  .inst-build:first-of-type { border-top: 0; }
  .inst-build .site-h2 { margin-top: 0.6rem; }
  .inst-get { margin: 1.1rem 0 0.5rem; }
  .inst-help { display: flex; gap: 0.6rem; align-items: center; margin-top: 2.2rem; }
</style>
