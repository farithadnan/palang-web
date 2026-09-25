<script>
  /** Palang tab: file basket; tapping a file opens the positioning editor as an
   *  expanded modal (same pattern as Convert's photo editor). */
  import { t } from "../lib/i18n.js";
  import FileBasket from "./ui/FileBasket.svelte";
  import Modal from "./ui/Modal.svelte";
  import PalangCanvas from "./ui/PalangCanvas.svelte";
  import PalangSpecFields from "./ui/PalangSpecFields.svelte";
  import {
    app,
    pickPreviewFiles,
    removePreviewFile,
    retryPreview,
    setActivePage,
    updateSpec,
    applyCompiled,
    flash,
    generate,
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
  <h2>{t("plTitle")}</h2>
  <p class="desc">
    Stamp a purpose bar across your document — transparent, so nothing is covered. You get a new copy; the original file is untouched.
  </p>

  <FileBasket
    id="palang-files"
    accept=".pdf,.jpg,.jpeg,.png,.webp,.bmp,.tif,.tiff"
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

    {#key app.activePage + "-" + app.spec.mode + "-" + app.spec.style + "-" + app.spec.armed}
      {#if pageUrl && pageReady}
        <PalangCanvas
          url={pageUrl}
          widthPt={active.w}
          heightPt={active.h}
          spec={app.spec}
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

    <div class="divider"></div>
    <PalangSpecFields spec={app.spec} onChange={(patch) => updateSpec(patch)} />

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
          void applyCompiled().then(() => flash("ok", t("plReadyToast")));
        }}
      >
        Apply &amp; save
      </button>
    </div>
  </Modal>
{/if}
