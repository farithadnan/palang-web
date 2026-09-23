<script>
  /** Palang tab: shared file basket, rendered page preview with zoom,
   *  drag-to-place marking (kept in view while dragging), marking fields,
   *  and a bottom action bar. */
  import Field from "./ui/Field.svelte";
  import FileBasket from "./ui/FileBasket.svelte";
  import PalangCanvas from "./ui/PalangCanvas.svelte";
  import PalangSpecFields from "./ui/PalangSpecFields.svelte";
  import {
    app,
    pickPreviewFiles,
    removePreviewFile,
    setActivePage,
    updateSpec,
    loadPreview,
    flash,
    generate,
  } from "../lib/store.svelte.js";

  const active = $derived(app.preview?.pages?.[app.activePage] ?? null);
  const pageUrl = $derived(active ? "data:image/png;base64," + active.png_base64 : "");

  const basketItems = $derived(
    app.previewFiles.map((f, i) => ({ id: "pf-" + i, name: f.name, icon: f.type?.startsWith("image/") ? "convert" : "file" }))
  );

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
    Stamp a purpose bar across your document, or cover a section like an IC number or address. You get a new copy; the original file is untouched.
  </p>

  <FileBasket
    id="palang-files"
    accept=".pdf,.jpg,.jpeg,.png,.webp,.bmp,.tif,.tiff"
    multiple
    main="Choose a document to stamp"
    sub="PDF, or images (converted to PDF first) · pages appear below for positioning"
    icon="palang"
    items={basketItems}
    removable
    onRemove={(id) => removePreviewFile(Number(id.replace("pf-", "")))}
    onPick={pickPreviewFiles}
  />

  {#if app.previewFiles.length}
    {#if app.previewLoading}
      <div class="spinner" role="status" aria-label="Rendering pages"></div>
      <p class="caption" style="text-align:center">
        {slow ? "Still preparing your document… large files can take a little longer." : "Rendering pages…"}
      </p>
    {:else if app.preview}
      <div class="pagethumbs" role="tablist" aria-label="Pages">
        {#each app.preview.pages as page, i (page.page)}
          <button
            type="button"
            class="pagethumb"
            class:active={i === app.activePage}
            role="tab"
            aria-selected={i === app.activePage}
            onclick={() => setActivePage(i)}
            aria-label={"Page " + page.page}
          >
            <img src={"data:image/png;base64," + page.png_base64} alt="" loading="lazy" />
          </button>
        {/each}
      </div>
      {#if app.preview.truncated}<p class="caption">Showing the first 20 pages.</p>{/if}

      {#if active}
        {#key app.activePage + "-" + app.spec.mode + "-" + app.spec.style + "-" + app.spec.armed}
          <Field
            label={"Page " + active.page + " — drag the marking anywhere"}
            hint={app.spec.style === "lines"
              ? "Transparent marking: the lines hug your text. Drag it to move it anywhere on the page; it stays in view as you drag."
              : "Drag the marking to move it; drag its handles to resize. Reset position brings it back to the middle."}
          >
            <PalangCanvas
              url={pageUrl}
              widthPt={active.width_pt}
              heightPt={active.height_pt}
              spec={app.spec}
              onChange={(patch) => updateSpec(patch)}
            />
          </Field>
        {/key}
      {/if}
    {:else}
      <div class="retrycard">
        <p class="desc">Unable to prepare this document. It may be too large or unsupported.</p>
        <div class="actionrow">
          <button type="button" class="btn btn-primary btn-sm" onclick={() => void loadPreview()}>Try again</button>
          <button type="button" class="btn btn-sm" onclick={removeDocument}>Choose another file</button>
        </div>
      </div>
    {/if}

    <div class="divider"></div>
    <PalangSpecFields spec={app.spec} showGeometry={false} onChange={(patch) => updateSpec(patch)} />
  {/if}

  <div class="actbar">
    <span class="caption">
      {app.spec.armed
        ? "Marking ready"
        : app.previewFiles.length
          ? "Tap anywhere on the page to add the marking"
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
