<script>
  /** Settings page: language, theme, and the update-check cadence.
   *  Each setting is one segmented control (a single cylinder with 2-3
   *  options), so the current choice and the alternatives are obvious. */
  import { app, setLang, setTheme, setUpdateFreq } from "../lib/store.svelte.js";
  import { t } from "../lib/i18n.js";
  import Segmented from "./ui/Segmented.svelte";

  const langOptions = $derived([
    { id: "en", label: "EN" },
    { id: "ms", label: "BM" },
  ]);

  const themeOptions = $derived([
    { id: "light", label: t("themeLight") },
    { id: "dark", label: t("themeDark") },
  ]);

  const freqOptions = $derived([
    { id: "daily", label: t("freqDaily") },
    { id: "weekly", label: t("freqWeekly") },
    { id: "never", label: t("freqOff") },
  ]);
</script>

<section class="panel flat settings">
  <h2>{t("settings")}</h2>

  <div class="kv stacked">
    <dt>{t("switchLang")}</dt>
    <dd>
      <Segmented options={langOptions} value={app.lang} onchange={setLang} label={t("switchLang")} />
    </dd>
  </div>

  <div class="kv stacked">
    <dt>{t("switchTheme")}</dt>
    <dd>
      <Segmented options={themeOptions} value={app.theme} onchange={setTheme} label={t("switchTheme")} />
    </dd>
  </div>

  <div class="kv stacked">
    <dt>{t("updateFreq")}</dt>
    <dd>
      <Segmented options={freqOptions} value={app.updateFreq} onchange={setUpdateFreq} label={t("updateFreq")} />
    </dd>
  </div>
</section>

<style>
  /* Rows and pills come from app.css: the app has one type scale and one row
     pattern, so About and Settings cannot drift apart. */
  .settings .kv { padding: 0.9rem 0; }
</style>
