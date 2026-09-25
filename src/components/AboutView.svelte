<script>
  /** About tab: app identity for installed builds (EXE/APK) and the web app.
   *  Logo, version, update check, license, links. Presentational. */
  import { APP_VERSION } from "../lib/version.js";
  import { checkForUpdate, app } from "../lib/store.svelte.js";
  import { t } from "../lib/i18n.js";

  let checking = $state(false);

  async function check() {
    checking = true;
    await checkForUpdate();
    checking = false;
  }
</script>

<section class="panel about" style="max-width: 34rem">
  <div class="about-head">
    <span class="about-logo" aria-hidden="true">
      <span></span><span></span>
    </span>
    <div>
      <h2>Palang</h2>
      <p class="caption">{t("aboutTagline")}</p>
    </div>
  </div>

  <dl class="about-list">
    <div><dt>{t("aboutVersion")}</dt><dd>v{APP_VERSION}</dd></div>
    <div><dt>{t("aboutLicense")}</dt><dd>MIT</dd></div>
    <div><dt>{t("aboutWebsite")}</dt><dd><a class="link" href="https://palang.oh-alam.my" target="_blank" rel="noopener" style="word-break:break-all">palang.oh-alam.my</a></dd></div>
    <div><dt>{t("aboutGithub")}</dt><dd><a class="link" href="https://github.com/farithadnan/palang-web" target="_blank" rel="noopener" style="word-break:break-all">github.com/farithadnan/palang-web</a></dd></div>
    <div><dt>{t("aboutIssues")}</dt><dd><a class="link" href="https://github.com/farithadnan/palang-web/issues" target="_blank" rel="noopener">{t("aboutIssuesLink")}</a></dd></div>
  </dl>

  <div class="about-update">
    <button type="button" class="btn btn-sm" disabled={checking || !!app.update} onclick={() => void check()}>
      {checking ? t("aboutChecking") : t("aboutCheckUpdate")}
    </button>
    {#if app.update}
      <span class="caption">{t("updateAvailable", { version: app.update.version })} — {t("updateNow")}</span>
    {/if}
  </div>

  <p class="caption about-note">{t("aboutNote")}</p>
</section>

<style>
  .about-head {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.4rem;
  }
  .about-head h2 { margin: 0; }
  /* The brand mark: rounded tile + the two band lines, mirrored in app.css. */
  .about-logo {
    width: 3.2rem;
    height: 3.2rem;
    border-radius: 0.7rem;
    background: var(--accent, #c9b458);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.32rem;
  }
  .about-logo span {
    display: block;
    width: 1.9rem;
    height: 0.24rem;
    border-radius: 2px;
    background: #111;
  }
  .about-logo span:nth-child(2) { opacity: 0.5; }
  .about-list div {
    display: flex;
    gap: 1rem;
    padding: 0.45rem 0;
    border-bottom: 1px solid var(--border, rgba(128,128,128,.25));
  }
  .about-list dt { width: 7.5rem; opacity: 0.75; }
  .about-list dd { margin: 0; }
  .about-update {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    margin-top: 1.2rem;
  }
  .about-note { margin-top: 1.2rem; }
</style>
