<script>
  /** Merge tab: dropzone + ordered PDF list + a fullscreen page viewer opened
   *  by tapping a row. The preview walks the WHOLE merged output — every
   *  file's pages, in merge order — one page at a time, so a 1000-page
   *  document never triggers bulk work. */
  import Dropzone from "./ui/Dropzone.svelte";
  import OrderedList from "./ui/OrderedList.svelte";
  import Icon from "./ui/Icon.svelte";
  import ResultBar from "./ui/ResultBar.svelte";
  import { t } from "../lib/i18n.js";
  import { app, addPdfs, movePdf, removePdf, selectMergeFile, stepMerge, generate, canMerge } from "../lib/store.svelte.js";

  let mergeInput = $state(null);
  let fsOpen = $state(false); // fullscreen page preview

  // The topbar "+" is a counter: open the picker only when it CHANGES, or
  // every mount re-opens the chooser by itself.
  let handledTick = 0;
  $effect(() => {
    const tick = app.requestAdd;
    if (!tick || tick === handledTick) return;
    handledTick = tick;
    mergeInput?.click();
  });

  function openFs(id) {
    selectMergeFile(id); // jumps the stepper to that file's first page
    fsOpen = true;
  }

  const items = $derived(
    app.pdfs.map((p, i) => ({
      id: p.id,
      label: p.file.name,
      sub: "",
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

<div class="panel flat">
  <h2>{t("mergeLabel")}</h2>

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

  {#if !app.pdfs.length}
    <Dropzone
      id="merge-files"
      accept=".pdf"
      multiple
      main={t("mgChoose")}
      sub={t("mgPickHint")}
      icon="merge"
      onPick={addPdfs}
      onRequest={() => mergeInput?.click()}
    />
  {:else}
    <OrderedList
      items={items}
      onSelect={openFs}
      onMove={movePdf}
      onRemove={removePdf}
      empty=""
    />
    {#if app.pdfs.length < 2}
      <p class="caption merge-hint">{t("mgNeedMore")}</p>
    {/if}
  {/if}

  <div class="actbar">
    <button
      type="button"
      class="btn btn-primary"
      disabled={!canMerge()}
      onclick={() => generate("merge")}
    >
      {app.busy ? t("working") : t("mergeLabel")}
    </button>
  </div>
  <ResultBar />
</div>

<style>
  .merge-hint { text-align: center; margin: 0.6rem 0 0; }
  .mgfs {
    position: fixed;
    inset: 0;
    z-index: 60;
    background: var(--bg, #111);
    display: flex;
    flex-direction: column;
    color: var(--text);
  }
  .mgfs-top {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.6rem 0.9rem;
    border-bottom: 1px solid var(--line);
    background: var(--panel);
  }
  .mgfs-name {
    flex: 1;
    font-size: 0.95rem;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .mgfs-stage {
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.8rem;
  }
  .mgfs-stage img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border-radius: 6px;
  }
  .mgfs-bar {
    align-self: center;
    display: flex;
    align-items: center;
    gap: 1rem;
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 0.3rem 0.9rem;
    margin-bottom: 1.4rem;
    box-shadow: var(--shadow);
  }
</style>

{#if fsOpen && mergePage}
  <div class="mgfs" role="dialog" aria-modal="true" aria-label={t("mergeLabel")}>
    <div class="mgfs-top">
      <button type="button" class="iconbtn" aria-label={t("close")} onclick={() => (fsOpen = false)}>
        <Icon name="x" size={22} />
      </button>
      <span class="mgfs-name" title={fileContext()}>{fileContext()}</span>
      <span style="width:2.2rem"></span>
    </div>
    <div class="mgfs-stage">
      {#if mergePage.url}
        <img src={mergePage.url} alt={fileContext()} />
      {:else if mergePage.loading}
        <div class="spinner" role="status" aria-label={t("mgRendering")}></div>
      {:else}
        <p class="caption">{t("mgNoPreview")}</p>
      {/if}
    </div>
    <div class="mgfs-bar">
      <button
        type="button"
        class="fpill-btn"
        aria-label={t("pagePrev")}
        disabled={app.merge.active <= 0}
        onclick={() => stepMerge(-1)}
      >
        <Icon name="chevL" size={20} />
      </button>
      <span class="caption">Page {app.merge.active + 1} of {total}</span>
      <button
        type="button"
        class="fpill-btn"
        aria-label={t("pageNext")}
        disabled={app.merge.active >= total - 1}
        onclick={() => stepMerge(1)}
      >
        <Icon name="chevR" size={20} />
      </button>
    </div>
  </div>
{/if}
