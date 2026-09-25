<script>
  /** Merge tab: dropzone + ordered PDF list (tap a row to jump its first
   *  page) + an embedded preview editor at the bottom. The preview walks the
   *  WHOLE merged output — every file's pages, in merge order — rendering
   *  one page at a time, so a 1000-page document never triggers bulk work. */
  import Dropzone from "./ui/Dropzone.svelte";
  import OrderedList from "./ui/OrderedList.svelte";
  import { t } from "../lib/i18n.js";
import { app, addPdfs, movePdf, removePdf, selectMergeFile, stepMerge, generate } from "../lib/store.svelte.js";

  let mergeInput;

  function humanSize(bytes) {
    return bytes >= 1048576 ? (bytes / 1048576).toFixed(1) + " MB" : (bytes / 1024).toFixed(0) + " KB";
  }

  const items = $derived(
    app.pdfs.map((p, i) => ({
      id: p.id,
      label: p.file.name,
      sub: humanSize(p.file.size),
      first: i === 0,
      last: i === app.pdfs.length - 1,
    }))
  );

  const mergePage = $derived(app.merge.pages?.[app.merge.active] ?? null);
  const total = $derived(app.merge.pages.length);

  /** Pages of the CURRENT file — "page k of m" context next to "page n of total". */
  function fileContext() {
    if (!mergePage) return "";
    let fileCount = 0;
    for (const pg of app.merge.pages) if (pg.pdfId === mergePage.pdfId) fileCount++;
    return mergePage.file.name + " · " + mergePage.page + " of " + fileCount + (mergePage.err ? " · " + t("mgPrevUnavail") : "");
  }
</script>

<div class="panel">
  <h2>{t("mergeLabel")}</h2>
  <p class="desc">{t("mgIntro")}</p>

  {#if !app.pdfs.length}
    <Dropzone
      id="merge-files"
      accept=".pdf"
      multiple
      main={t("mgChoose")}
      sub={t("mgPickHint")}
      icon="merge"
      onPick={addPdfs}
    />
  {:else}
    <OrderedList
      items={items}
      onSelect={selectMergeFile}
      onMove={movePdf}
      onRemove={removePdf}
      empty=""
    />
    <div class="actionrow">
      <button type="button" class="btn btn-sm" onclick={() => mergeInput?.click()}>{t('mgAddMore')}</button>
    </div>

    {#if mergePage}
      <div class="mrg-editor">
        <div class="mrg-frame">
          {#if mergePage.img || mergePage.url}
            <img src={mergePage.url} alt={fileContext()} />
          {:else if mergePage.loading}
            <div class="spinner" role="status" aria-label={t("mgRendering")}></div>
          {:else}
            <p class="caption">{t("mgNoPreview")}</p>
          {/if}
        </div>
        <div class="page-stepper">
          <button
            type="button"
            class="btn btn-sm"
            aria-label="Previous page"
            disabled={app.merge.active <= 0}
            onclick={() => stepMerge(-1)}
          >
            ←
          </button>
          <span class="caption" title={fileContext()}>
            {fileContext()} — Page {app.merge.active + 1} of {total}
          </span>
          <button
            type="button"
            class="btn btn-sm"
            aria-label="Next page"
            disabled={app.merge.active >= total - 1}
            onclick={() => stepMerge(1)}
          >
            →
          </button>
        </div>
      </div>
    {/if}
    <input
      bind:this={mergeInput}
      class="hidden-input"
      id="merge-more"
      type="file"
      accept=".pdf"
      multiple
      onchange={(e) => {
        if (e.currentTarget.files?.length) addPdfs(e.currentTarget.files);
        e.currentTarget.value = "";
      }}
    />
  {/if}

  <div class="actbar">
    <span class="caption">
      {app.pdfs.length ? t("mgSummary", { n: app.pdfs.length, s: app.pdfs.length > 1 ? "s" : "" }) : t("mgEmpty")}
    </span>
    <button
      type="button"
      class="btn btn-primary"
      disabled={!app.pdfs.length || app.busy}
      onclick={() => generate("merge")}
    >
      {app.busy ? t("plWorking") : t("mergeLabel")}
    </button>
  </div>
</div>
