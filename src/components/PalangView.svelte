<script>
  /** Palang tab: file basket; tapping a file opens the positioning editor as an
   *  expanded modal (same pattern as Convert's photo editor). */
  import { t } from "../lib/i18n.js";
  import { ACCEPT } from "../lib/pick.js";
  import ToolHeader from "./ui/ToolHeader.svelte";
  import FileBasket from "./ui/FileBasket.svelte";
  import Modal from "./ui/Modal.svelte";
  import ResultBar from "./ui/ResultBar.svelte";
  import PalangCanvas from "./ui/PalangCanvas.svelte";
  import PalangSpecFields from "./ui/PalangSpecFields.svelte";
  import {
    app,
    pickPreviewFiles,
    removePreviewFile,
    retryPreview,
    setActivePage,
    updateSpec,
    addSpec,
    removeSpecAt,
    setSpecIndex,
    applyCompiled,
    flash,
    generate,
    requestAdd,
  } from "../lib/store.svelte.js";

  const active = $derived(app.preview?.pages?.[app.activePage] ?? null);
  const pageUrl = $derived(active ? active.url ?? "" : "");
  const pageReady = $derived(!!(active?.w && active?.h));

  const basketItems = $derived(
    app.previewFiles.map((f, i) => ({
      id: "pf-" + i,
      name: f.name,
      // Images shown instantly get a real thumbnail from their object URL.
      url: f.type?.startsWith("image/") && app.preview?.client ? app.preview.pages[i]?.url : undefined,
      icon: f.type?.startsWith("image/") ? "convert" : "file",
    }))
  );

  let editing = $state(false);

  // After ~5s of rendering, reassure the user the app is still working.
  let slow = $state(false);
  $effect(() => {
    if (!app.previewLoading) {
      slow = false;
      return;
    }
    const t = setTimeout(() => (slow = true), 5000);
    return () => clearTimeout(t);
  });

  function removeDocument() {
    while (app.previewFiles.length) removePreviewFile(0);
  }
</script>

<div class="panel flat">
  <ToolHeader title={t("plTitle")} onAdd={requestAdd} addLabel={t("addFiles")} />
  <p class="desc">
    Stamp a purpose bar across your document — transparent, so nothing is covered. You get a new copy; the original file is untouched.
  </p>

  <FileBasket
    id="palang-files"
    accept={ACCEPT.pdfAndImages}
    multiple
    main={t("plChoose")}
    icon="palang"
    requestAddTick={app.requestAdd}
    items={basketItems}
    onRemove={(id) => removePreviewFile(Number(id.replace("pf-", "")))}
    onItem={(id) => {
      // Open the editor on the tapped file, not the first one.
      setActivePage(Number(id.replace("pf-", "")));
      editing = true;
    }}
    onPick={pickPreviewFiles}
  />

  {#if app.previewFiles.length}
    {#if app.previewLoading}
      <div class="spinner" role="status" aria-label={t("plPreparing")}></div>
      <p class="caption" style="text-align:center">
        {slow ? t("plStillPreparing") : t("plPreparingEll")}
      </p>
    {:else if !app.preview}
      <div class="retrycard">
        <p class="desc">{t("plUnable")}</p>
        <div class="actionrow">
          <button type="button" class="btn btn-primary btn-sm" onclick={() => void retryPreview()}>{t('plTryAgain')}</button>
          <button type="button" class="btn btn-sm" onclick={removeDocument}>{t('plChooseOther')}</button>
        </div>
      </div>
    {/if}
  {/if}

  <div class="actbar">
    <button
      type="button"
      class="btn btn-primary"
      disabled={!app.previewFiles.length || app.busy}
      onclick={() => generate("palang")}
    >
      {app.busy ? t("plWorking") : t("plStamp")}
    </button>
  </div>
  <ResultBar />
</div>

{#if editing && active}
  <Modal title={t("plPosTitle")} wide onClose={() => (editing = false)}>
    {#if app.preview && app.preview.pages.length > 1}
      <div class="page-stepper">
        <button
          type="button"
          class="btn btn-sm"
          aria-label={t("pagePrev")}
          disabled={app.activePage === 0}
          onclick={() => setActivePage(Math.max(0, app.activePage - 1))}
        >
          ←
        </button>
        <span class="caption">Page {app.activePage + 1} of {app.preview.pages.length}</span>
        <button
          type="button"
          class="btn btn-sm"
          aria-label={t("pageNext")}
          disabled={app.activePage >= app.preview.pages.length - 1}
          onclick={() => setActivePage(Math.min(app.preview.pages.length - 1, app.activePage + 1))}
        >
          →
        </button>
      </div>
    {/if}

    {#key app.activePage + "-" + (app.specs[app.specIndex]?.mode ?? "") + "-" + (app.specs[app.specIndex]?.style ?? "") + "-" + (app.specs[app.specIndex]?.armed ?? false)}
      {#if pageUrl && pageReady}
        <PalangCanvas
          url={pageUrl}
          widthPt={active.w}
          heightPt={active.h}
          spec={app.specs[app.specIndex] ?? app.specs[0]}
          fitContain={!!active.url}
          onChange={(patch) => updateSpec(patch)}
        />
      {:else if active?.loading}
        <div class="pv-loading" role="status">
          <div class="spinner"></div>
          <p class="caption">Rendering page {active.page}…</p>
        </div>
      {:else}
        <div class="pv-loading">
          <p class="caption">This page can&apos;t be previewed — the marking is still placed at its true size.</p>
          <button type="button" class="btn btn-sm" onclick={() => void retryPreview()}>{t('plTryAgain')}</button>
        </div>
      {/if}
    {/key}
    <p class="caption" style="text-align:center">
      Drag the marking to move it · the knob above tilts it · the corner stretches it · wheel or pinch zooms
    </p>

    <div class="spec-chips" role="tablist" aria-label={t("plStamps")}>
      {#each app.specs as s, i (i)}
        <button
          type="button"
          class="chip"
          class:on={i === app.specIndex}
          onclick={() => setSpecIndex(i)}
          aria-label={t("plStampSelect", { n: i + 1 })}
        >
          <span class="chip-label">{s.text.trim().slice(0, 18) || t("plStamp") + " " + (i + 1)}</span>
          {#if app.specs.length > 1}
            <span
              role="button"
              tabindex="-1"
              class="chip-x"
              aria-label={t("plStampRemove", { n: i + 1 })}
              onclick={(e) => {
                e.stopPropagation();
                removeSpecAt(i);
              }}
            >
              ×
            </span>
          {/if}
        </button>
      {/each}
      <button type="button" class="chip chip-add" onclick={addSpec} aria-label={t("plStampAdd")}>
        +
      </button>
    </div>

    <PalangSpecFields spec={app.specs[app.specIndex] ?? app.specs[0]} onChange={(patch) => updateSpec(patch)} />

    <div class="modal-actions modal-actions-sticky">
      <button type="button" class="btn" onclick={() => (editing = false)}>Cancel</button>
      <button
        type="button"
        class="btn btn-primary"
        onclick={() => {
          // Apply & save: compile the photos with the marking baked in ("the
          // second temp") — the editor keeps the originals for re-editing,
          // and Stamp will use the compiled images.
          editing = false;
          void applyCompiled().then(() => flash("ok", t("msgReady")));
        }}
      >
        Apply &amp; save
      </button>
    </div>
  </Modal>
{/if}

<style>
  .spec-chips {
    display: flex;
    gap: 0.45rem;
    flex-wrap: wrap;
    padding: 0.6rem 0 0.9rem;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    max-width: 100%;
    border: 1px solid var(--border, rgba(128,128,128,.35));
    background: transparent;
    color: var(--text);
    border-radius: 999px;
    padding: 0.35rem 0.8rem;
    font-size: var(--fs-note);
    cursor: pointer;
  }
  .chip.on { background: var(--accent, #c9b458); border-color: transparent; color: #111; }
  .chip-x {
    font-size: 1.05rem;
    line-height: 1;
    padding: 0 0.1rem;
    opacity: 0.8;
    cursor: pointer;
  }
  .chip-add { font-size: 1.15rem; padding: 0.25rem 0.85rem; }
</style>
