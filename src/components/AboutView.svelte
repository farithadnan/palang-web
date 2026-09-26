<script>
  /** About tab: app identity + update check. Logo centered, version with build
   *  date + channel, links as icon buttons, and an explicit update flow
   *  (button -> spinner -> result row -> download button) so "checking" is
   *  never indistinguishable from "nothing happened". Presentational. */
  import { APP_VERSION, APP_BUILT_AT, APP_CHANNEL } from "../lib/version.js";
  import { app, applyUpdate, checkNow, releaseUrl } from "../lib/store.svelte.js";
  import { t } from "../lib/i18n.js";
  import { GITHUB_URL, ISSUES_URL, SITE_URL } from "../lib/links.js";
  import Icon from "./ui/Icon.svelte";

  let checking = $state(false);
  let status = $state(""); // "" | "latest" | "update" | "error"

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
    status = "";
    const r = await checkNow();
    status = r.state;
    checking = false;
  }
</script>

<section class="about">
  <div class="about-logo" aria-hidden="true"><span></span><span></span></div>
  <h2 class="about-name">Palang</h2>

  <dl class="about-kv">
    <div class="kv"><dt>{t("aboutVersion")}</dt><dd>v{APP_VERSION}</dd></div>
    <div class="kv"><dt>{t("aboutDate")}</dt><dd>{fmtDate(APP_BUILT_AT)}</dd></div>
    <div class="kv"><dt>{t("aboutChannel")}</dt><dd>{APP_CHANNEL}</dd></div>
    <div class="kv"><dt>{t("aboutLicense")}</dt><dd>MIT</dd></div>
  </dl>

  <div class="about-update">
    <button type="button" class="btn about-check" disabled={checking} onclick={() => void check()}>
      {#if checking}
        <span class="spinner spinner-xs" aria-hidden="true"></span>
        {t("aboutChecking")}
      {:else}
        <Icon name="download" size={17} />
        {t("aboutCheckUpdate")}
      {/if}
    </button>

    {#if status && !checking}
      <p class="about-status" class:bad={status === "error"}>
        {status === "latest" ? t("aboutUpToDate") : status === "error" ? t("aboutCheckFailed") : t("aboutUpdateFound", { version: app.update?.version ?? "" })}
      </p>
    {/if}

    {#if app.update}
      <a class="btn btn-primary about-download" href={releaseUrl()} target="_blank" rel="noopener">
        {t("aboutDownload")}
      </a>
      <button type="button" class="link about-reload" onclick={applyUpdate}>{t("updateNow")}</button>
    {/if}
  </div>

  <div class="about-links">
    <a class="iconbtn" href={SITE_URL} target="_blank" rel="noopener" aria-label={t("aboutWebsite")}>
      <Icon name="globe" size={20} />
    </a>
    <a class="iconbtn" href={GITHUB_URL} target="_blank" rel="noopener" aria-label={t("aboutGithub")}>
      <Icon name="github" size={20} />
    </a>
    <a class="iconbtn" href={ISSUES_URL} target="_blank" rel="noopener" aria-label={t("aboutIssues")}>
      <Icon name="bug" size={20} />
    </a>
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
  .about-name { text-align: center; margin: 0; font-size: var(--fs-title); }

  .about-kv { margin: 1.4rem 0 0; }

  .about-update {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.6rem;
    margin-top: 1.5rem;
  }
  .about-check { width: 100%; gap: 0.5rem; }
  .about-status {
    margin: 0;
    text-align: center;
    font-size: var(--fs-btn);
    color: var(--muted);
  }
  .about-status.bad { color: var(--bad); }
  .about-download { width: 100%; text-decoration: none; }
  .about-reload { align-self: center; font-size: var(--fs-btn); }

  .about-links {
    display: flex;
    justify-content: center;
    gap: 0.7rem;
    margin-top: 1.4rem;
  }
</style>
