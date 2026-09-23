<script>
  /** Palang tab: file basket; tapping a file opens the positioning editor as an
   *  expanded modal (same pattern as Convert's photo editor). */
  import FileBasket from "./ui/FileBasket.svelte";
  import Modal from "./ui/Modal.svelte";
  import PalangCanvas from "./ui/PalangCanvas.svelte";
  import PalangSpecFields from "./ui/PalangSpecFields.svelte";
  import {
    app,
    pickPreviewFiles,
    removePreviewFile,
    setActivePage,
    updateSpec,
    loadPreview,
    generate,
  } from "../lib/store.svelte.js";

  const active = $derived(app.preview?.pages?.[app.activePage] ?? null);
  const pageUrl = $derived(
    active
      ? active.url ?? "data:" + (active.mime || "image/jpeg") + ";base64," + active.png_base64
      : ""
  );

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

<div class="panel">
  <h2>Add a palang watermark</h2>
  <p class="desc">
    Stamp a purpose bar across your document — transparent, so nothing is covered. You get a new copy; the original file is untouched.
  </p>

  <FileBasket
    id="palang-files"
    accept=".pdf,.jpg,.jpeg,.png,.webp,.bmp,.tif,.tiff"
    multiple
    main="Choose a document to stamp"
    sub="PDF, or images · tap a file to position your marking"
    icon="palang"
    items={basketItems}
    onRemove={(id) => removePreviewFile(Number(id.replace("pf-", "")))}
    onItem={() => (editing = true)}
    onPick={pickPreviewFiles}
  />

  {#if app.previewFiles.length}
    {#if app.previewLoading}
      <div class="spinner" role="status" aria-label="Preparing document"></div>
      <p class="caption" style="text-align:center">
        {slow ? "Still preparing your document… large files can take a little longer." : "Preparing…"}
      </p>
    {:else if !app.preview}
      <div class="retrycard">
        <p class="desc">Unable to prepare this document. It may be too large or unsupported.</p>
        <div class="actionrow">
          <button type="button" class="btn btn-primary btn-sm" onclick={() => void loadPreview()}>Try again</button>
          <button type="button" class="btn btn-sm" onclick={removeDocument}>Choose another file</button>
        </div>
      </div>
    {/if}
  {/if}

  <div class="actbar">
    <span class="caption">
      {app.spec.armed
        ? "Marking ready"
        : app.previewFiles.length
          ? "Tap a file to position the marking"
          : "No document added yet"}
    </span>
    <button
      type="button"
      class="btn btn-primary"
      disabled={!app.previewFiles.length || app.busy}
      onclick={() => generate("palang")}
    >
      {app.busy ? "Working…" : "Stamp PDF"}
    </button>
  </div>
</div>

{#if editing && active}
  <Modal title="Position your marking" wide onClose={() => (editing = false)}>
    {#if app.preview && app.preview.pages.length > 1}
      <div class="page-stepper">
        <button
          type="button"
          class="btn btn-sm"
          aria-label="Previous page"
          disabled={app.activePage === 0}
          onclick={() => setActivePage(Math.max(0, app.activePage - 1))}
        >
          ←
        </button>
        <span class="caption">Page {app.activePage + 1} of {app.preview.pages.length}</span>
        <button
          type="button"
          class="btn btn-sm"
          aria-label="Next page"
          disabled={app.activePage >= app.preview.pages.length - 1}
          onclick={() => setActivePage(Math.min(app.preview.pages.length - 1, app.activePage + 1))}
        >
          →
        </button>
      </div>
    {/if}

    {#key app.activePage + "-" + app.spec.mode + "-" + app.spec.style + "-" + app.spec.armed}
      <PalangCanvas
        url={pageUrl}
        widthPt={active.width_pt}
        heightPt={active.height_pt}
        spec={app.spec}
        fitContain={!!active.url}
        onChange={(patch) => updateSpec(patch)}
      />
    {/key}
    <p class="caption" style="text-align:center">
      Drag the marking to move it · the knob above tilts it · the corner stretches it · wheel or pinch zooms
    </p>

    <div class="divider"></div>
    <PalangSpecFields spec={app.spec} onChange={(patch) => updateSpec(patch)} />

    <div class="modal-actions">
      <button type="button" class="btn" onclick={() => (editing = false)}>Close</button>
      <button type="button" class="btn btn-primary" onclick={() => (editing = false)}>Done</button>
    </div>
  </Modal>
{/if}
