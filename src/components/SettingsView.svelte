<script>
  /** Settings page: language, theme, and the update-check cadence.
   *  Each setting is a full-width row of pills (the pill group spans the
   *  whole width, so the choice is obvious on a phone). */
  import { app, setLang, setTheme, setUpdateFreq } from "../lib/store.svelte.js";
  import { t } from "../lib/i18n.js";

  const FREQS = [
    { id: "daily", label: () => t("freqDaily") },
    { id: "weekly", label: () => t("freqWeekly") },
    { id: "never", label: () => t("freqOff") },
  ];
</script>

<section class="panel flat settings">
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
    gap: 0.5rem;
    padding: 0.9rem 0;
    border-bottom: 1px solid var(--line);
  }
  .kv:last-child { border-bottom: 0; }
  .kv dt { font-size: 0.82rem; color: var(--muted); }
  .kv dd { display: flex; gap: 0.45rem; margin: 0; }
  .seg {
    flex: 1;
    border: 1px solid var(--line);
    background: transparent;
    color: var(--text);
    padding: 0.6rem 1rem;
    border-radius: 999px;
    font-size: 0.92rem;
    font-weight: 600;
    cursor: pointer;
  }
  .seg.on { background: var(--accent, #c9b458); border-color: transparent; color: #111; }
</style>
