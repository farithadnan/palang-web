<script>
  /** About tab: app identity + settings. Logo centered, version with build
   *  date + channel, links as icons, update check as a label, and the
   *  language/theme toggles that used to live in the topbar. Presentational. */
  import { APP_VERSION, APP_BUILT_AT, APP_CHANNEL } from "../lib/version.js";
  import { app, applyUpdate, checkForUpdate } from "../lib/store.svelte.js";
  import { t } from "../lib/i18n.js";
  import Icon from "./ui/Icon.svelte";

  let checking = $state(false);

  function fmtDate(iso) {
    try {
      const d = new Date(iso);
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const hh24 = d.getHours();
      const ampm = hh24 >= 12 ? "PM" : "AM";
      const hh = String(((hh24 + 11) % 12) + 1).padStart(2, "0");
      const mi = String(d.getMinutes()).padStart(2, "0");
      return `${dd}/${mm}/${d.getFullYear()} · ${hh}:${mi} ${ampm}`;
    } catch {
      return "";
    }
  }

  async function check() {
    if (checking) return;
    checking = true;
    await checkForUpdate();
    checking = false;
  }
</script>

<section class="about">
  <div class="about-logo" aria-hidden="true"><span></span><span></span></div>
  <h2 class="about-name">Palang</h2>

  <dl class="about-kv">
    <div class="kv"><dt>{t("aboutVersion")}</dt><dd>v{APP_VERSION}</dd></div>
    <div class="kv">
      <dt>{t("aboutDate")}</dt>
      <dd>{fmtDate(APP_BUILT_AT)}</dd>
    </div>
    <div class="kv"><dt>{t("aboutChannel")}</dt><dd>{APP_CHANNEL}</dd></div>
    <div class="kv"><dt>{t("aboutLicense")}</dt><dd>MIT</dd></div>
  </dl>

  <div class="about-links">
    <a class="iconbtn" href="https://palang.oh-alam.my" target="_blank" rel="noopener" aria-label={t("aboutWebsite")}>
      <Icon name="globe" size={20} />
    </a>
    <a class="iconbtn" href="https://github.com/farithadnan/palang-web" target="_blank" rel="noopener" aria-label={t("aboutGithub")}>
      <Icon name="github" size={20} />
    </a>
    <a class="iconbtn" href="https://github.com/farithadnan/palang-web/issues" target="_blank" rel="noopener" aria-label={t("aboutIssues")}>
      <Icon name="bug" size={20} />
    </a>
  </div>

  <div class="about-update">
    <button type="button" class="link" onclick={() => void check()} disabled={checking}>
      {checking ? t("aboutChecking") : t("aboutCheckUpdate")}
    </button>
    {#if app.update}
      <button type="button" class="link" onclick={applyUpdate}>
        {t("updateAvailable", { version: app.update.version })} — {t("updateNow")}
      </button>
    {/if}
  </div>
</section>

<style>
  /* Reuse the topbar brand mark exactly (uniform logo). */
  .about-logo {
    width: 4rem;
    height: 4rem;
    margin: 1.6rem auto 0.9rem;
    border-radius: 0.9rem;
    background: var(--accent, #c9b458);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
  }
  .about-logo span {
    display: block;
    width: 2.3rem;
    height: 0.3rem;
    border-radius: 2px;
    background: #111;
  }
  .about-logo span:nth-child(2) { opacity: 0.5; }
  .about-name { text-align: center; margin: 0; }

  .about-kv, .about-settings { margin-top: 1.2rem; }
  .kv {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--border, rgba(128,128,128,.22));
  }
  .kv dt { font-size: 0.78rem; opacity: 0.65; text-transform: uppercase; letter-spacing: 0.04em; }
  .kv dd { margin: 0; font-size: 0.95rem; }

  .about-links {
    display: flex;
    justify-content: center;
    gap: 0.7rem;
    margin-top: 1.2rem;
  }
  .about-update {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-top: 1rem;
    font-size: 0.95rem;
  }
  .about-update .link:disabled { opacity: 0.6; }
</style>
