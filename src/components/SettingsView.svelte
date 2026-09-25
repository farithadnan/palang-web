<script>
  /** Settings page: language, theme, and the update-check cadence. */
  import { app, setLang, setTheme, setUpdateFreq } from "../lib/store.svelte.js";
  import { t } from "../lib/i18n.js";

  const FREQS = [
    { id: "daily", label: () => t("freqDaily") },
    { id: "weekly", label: () => t("freqWeekly") },
    { id: "never", label: () => t("freqOff") },
  ];
</script>

<section class="panel flat settings" style="max-width: 34rem">
  <h2>{t("settings")}</h2>

  <div class="kv">
    <dt>{t("switchLang")}</dt>
    <dd>
      <button type="button" class="seg" class:on={app.lang === "en"} onclick={() => setLang("en")}>EN</button>
      <button type="button" class="seg" class:on={app.lang === "ms"} onclick={() => setLang("ms")}>BM</button>
    </dd>
  </div>

  <div class="kv">
    <dt>{t("switchTheme")}</dt>
    <dd>
      <button type="button" class="seg" class:on={app.theme === "light"} onclick={() => setTheme("light")}>{t("themeLight")}</button>
      <button type="button" class="seg" class:on={app.theme === "dark"} onclick={() => setTheme("dark")}>{t("themeDark")}</button>
    </dd>
  </div>

  <div class="kv">
    <dt>{t("updateFreq")}</dt>
    <dd>
      {#each FREQS as f (f.id)}
        <button type="button" class="seg" class:on={app.updateFreq === f.id} onclick={() => setUpdateFreq(f.id)}>
          {f.label()}
        </button>
      {/each}
    </dd>
  </div>
</section>

<style>
  .kv {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding: 0.7rem 0;
  }
  .kv dt { font-size: 0.85rem; opacity: 0.75; }
  .kv dd { display: flex; gap: 0.5rem; flex-wrap: wrap; margin: 0; }
  .kv dd:last-child { padding-bottom: 1rem; }
  .seg {
    border: 1px solid var(--border, rgba(128,128,128,.35));
    background: transparent;
    color: var(--text);
    padding: 0.45rem 1rem;
    border-radius: 999px;
    font-size: 0.92rem;
    cursor: pointer;
  }
  .seg.on { background: var(--accent, #c9b458); border-color: transparent; color: #111; }
</style>
