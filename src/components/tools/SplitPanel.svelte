<script>
  /** Extract panel (inside the Merge tab): choose one PDF, type page ranges,
   *  then export one PDF or one PDF per range. Presentational — the store owns
   *  the file, the page count and the export. */
  import Dropzone from "../ui/Dropzone.svelte";
  import Field from "../ui/Field.svelte";
  import BusyButton from "../ui/BusyButton.svelte";
  import { t } from "../../lib/i18n/index.js";
  import { takeFiles, ACCEPT } from "../../lib/util/pick.js";
  import {
    app,
    setSplitFile,
    setSplitRanges,
    generateSplit,
  } from "../../lib/state/store.svelte.js";

  let input = $state(null);

  function onPick(files) {
    const [file] = files;
    if (file) setSplitFile(file);
  }
</script>

<input
  bind:this={input}
  class="hidden-input"
  id="split-file"
  type="file"
  accept={ACCEPT.pdf}
  onchange={(e) => onPick(takeFiles(e.currentTarget))}
/>

{#if !app.split.file}
  <Dropzone
    id="split-drop"
    accept={ACCEPT.pdf}
    main={t("splitChoose")}
    sub={t("splitChooseHint")}
    icon="split"
    onPick={onPick}
    onRequest={() => input?.click()}
  />
{:else}
  <div class="split-file">
    <span class="split-name" title={app.split.file.name}>{app.split.file.name}</span>
    <span class="split-meta">
      {app.split.count ? t("splitPages", { n: app.split.count }) : t("splitReading")}
    </span>
    <button type="button" class="btn btn-sm" onclick={() => setSplitFile(null)}>{t("close")}</button>
  </div>

  <Field label={t("splitRanges")} hint={t("splitRangesHint")}>
    <input
      type="text"
      value={app.split.ranges}
      placeholder="1-3, 5, 8-10"
      disabled={!app.split.count}
      oninput={(e) => setSplitRanges(e.currentTarget.value)}
    />
  </Field>

  <div class="actbar">
    <BusyButton
      busy={app.busy}
      disabled={!app.split.count}
      label={t("splitExtract")}
      busyLabel={t("working")}
      onclick={() => generateSplit(false)}
    />
    <button
      type="button"
      class="btn"
      disabled={app.busy || !app.split.count}
      onclick={() => generateSplit(true)}
    >
      {t("splitOnePerRange")}
    </button>
  </div>
{/if}

<style>
  .split-file {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.7rem 0.85rem;
    margin: 0.9rem 0;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: color-mix(in srgb, var(--accent) 8%, transparent);
  }
  .split-name {
    flex: 1;
    min-width: 0;
    font-weight: 600;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .split-meta { color: var(--muted); font-size: var(--fs-note); flex: none; }
</style>
