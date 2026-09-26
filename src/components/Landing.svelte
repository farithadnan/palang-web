<script>
  /** The public SITE root. One component behind the `$landing` alias, so the
   *  app-only build (EXE/APK) tree-shakes every page out of the bundle.
   *  Routes: / (home), /install, /privacy, /features/<id>, /docs. */
  import Topbar from "./ui/Topbar.svelte";
  import HomePage from "./site/HomePage.svelte";
  import FeaturePage from "./site/FeaturePage.svelte";
  import InstallPage from "./site/InstallPage.svelte";
  import PrivacyPage from "./site/PrivacyPage.svelte";
  import DevDocs from "./DevDocs.svelte";
  import { t } from "../lib/i18n.js";
  import { GITHUB_URL } from "../lib/links.js";
  import { href, goto } from "../lib/router.js";

  let { page = "home", feature = "convert" } = $props();

  const YEAR = new Date().getFullYear();
</script>

<svelte:head>
  <title>Palang — {t("title")}</title>
  <meta name="description" content={t("lede")} />
</svelte:head>

<div class="site">
  <Topbar context="landing" ctaLabel={t("getTheApp")} onOpenApp={() => goto("install")}>
    {#snippet children()}
      <a href={href("features/convert")}>{t("features")}</a>
      <a href={href("docs")}>{t("docTitle")}</a>
      <a href={GITHUB_URL} target="_blank" rel="noopener">GitHub</a>
    {/snippet}
  </Topbar>

  {#if page === "install"}
    <InstallPage />
  {:else if page === "privacy"}
    <PrivacyPage />
  {:else if page === "feature"}
    <FeaturePage id={feature} />
  {:else if page === "docs"}
    <DevDocs />
  {:else}
    <HomePage />
  {/if}

  <footer class="site-foot">
    <div class="site-footrow">
      <a href={href("privacy")}>{t("privacyPolicy")}</a>
      <span class="footdot">·</span>
      <span>MIT License</span>
      <span class="footdot">·</span>
      <span>© {YEAR} Palang</span>
    </div>
  </footer>
</div>

<style>
  .site {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
</style>
