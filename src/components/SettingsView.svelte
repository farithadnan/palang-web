<script>
  /** Settings page: language, theme, default paper size, and the default
   *  palang text, plus the update-check cadence. Each choice is one segmented
   *  control (a single cylinder), so the current value and alternatives read
   *  at a glance. */
  import {
    app,
    setLang,
    setTheme,
    setDefaultPageSize,
    setDefaultText,
    setUpdateFreq,
  } from "../lib/store.svelte.js";
  import { t } from "../lib/i18n.js";
  import Segmented from "./ui/Segmented.svelte";

  const langOptions = $derived([
    { id: "en", label: "EN" },
    { id: "ms", label: "BM" },
  ]);

  const themeOptions = $derived([
    { id: "system", label: t("themeSystem") },
    { id: "light", label: t("themeLight") },
    { id: "dark", label: t("themeDark") },
  ]);

  const paperOptions = $derived([
    { id: "fit", label: t("pageFit") },
    { id: "A4", label: "A4" },
    { id: "A5", label: "A5" },
    { id: "Letter", label: "Letter" },
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
    <dt>{t("defaultPaper")}</dt>
    <dd>
      <Segmented options={paperOptions} value={app.pageSize} onchange={setDefaultPageSize} label={t("defaultPaper")} />
    </dd>
  </div>

  <div class="kv stacked">
    <dt>{t("defaultText")}</dt>
    <dd>
      <input
        type="text"
        value={app.defaultText ?? ""}
        placeholder="UNTUK KEGUNAAN BANK SAHAJA"
        onchange={(e) => setDefaultText(e.currentTarget.value.trim())}
      />
    </dd>
  </div>
  <p class="hint">{t("defaultTextHint")}</p>

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
  .settings .hint { margin: -0.2rem 0 0.4rem; }
</style>
