<script>
  /** Settings page, grouped so it is clear which setting belongs where:
   *  App (language, theme, update), Convert (paper size), Palang (text). Each
   *  choice is one segmented control, so the value and options read at once. */
  import {
    app,
    setLang,
    setTheme,
    setDefaultPageSize,
    setDefaultText,
    setUpdateFreq,
  } from "../../lib/state/store.svelte.js";
  import { t } from "../../lib/i18n/index.js";
  import Segmented from "../ui/Segmented.svelte";

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

  <h3 class="set-group">{t("setGroupApp")}</h3>

  <div class="kv stacked">
    <dt>{t("switchLang")}</dt>
    <dd>
      <Segmented options={langOptions} value={app.lang} onchange={setLang} label={t("switchLang")} />
    </dd>
    <p class="set-desc">{t("switchLangDesc")}</p>
  </div>

  <div class="kv stacked">
    <dt>{t("switchTheme")}</dt>
    <dd>
      <Segmented options={themeOptions} value={app.theme} onchange={setTheme} label={t("switchTheme")} />
    </dd>
    <p class="set-desc">{t("switchThemeDesc")}</p>
  </div>

  <div class="kv stacked">
    <dt>{t("updateFreq")}</dt>
    <dd>
      <Segmented options={freqOptions} value={app.updateFreq} onchange={setUpdateFreq} label={t("updateFreq")} />
    </dd>
    <p class="set-desc">{t("updateFreqDesc")}</p>
  </div>

  <h3 class="set-group">{t("setGroupConvert")}</h3>

  <div class="kv stacked">
    <dt>{t("defaultPaper")}</dt>
    <dd>
      <Segmented options={paperOptions} value={app.pageSize} onchange={setDefaultPageSize} label={t("defaultPaper")} />
    </dd>
    <p class="set-desc">{t("defaultPaperDesc")}</p>
  </div>

  <h3 class="set-group">{t("setGroupPalang")}</h3>

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
    <p class="set-desc">{t("defaultTextDesc")}</p>
  </div>
</section>

<style>
  /* Rows and pills come from app.css: the app has one type scale and one row
     pattern, so About and Settings cannot drift apart. */
  .settings .kv { padding: 0.9rem 0; }
  .settings .set-desc { margin: 0; font-size: var(--fs-note); color: var(--muted); line-height: 1.5; }
  .set-group {
    margin: 1.5rem 0 0.2rem;
    font-size: var(--fs-label);
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
  }
</style>
