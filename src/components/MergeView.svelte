<script>
  /** Merge tab: dropzone + ordered PDF list (tap a row to preview) + an
   *  embedded preview editor at the bottom — one page rendered at a time,
   *  so a 1000-page document never triggers bulk work. */
  import Dropzone from "./ui/Dropzone.svelte";
  import OrderedList from "./ui/OrderedList.svelte";
  import { app, addPdfs, movePdf, removePdf, selectPdfFile, stepPdfFile, generate } from "../lib/store.svelte.js";

  let mergeInput;

  const items = $derived(
    app.pdfs.map((p, i) => ({
      id: p.id,
      label: p.file.name,
      sub: (p.file.size / 1024).toFixed(0) + " KB",
      first: i === 0,
      last: i === app.pdfs.length - 1,
    }))
  );

  const previewPdf = $derived(app.pdfs.find((p) => p.id === app.activePdfId) ?? null);
  const countLabel = $derived(
    previewPdf ? (previewPdf.count ?? "…") + " page" + (previewPdf.count === 1 ? "" : "s") : ""
  );
</script>

<div class="panel">
  <h2>Merge PDFs</h2>
  <p class="desc">Combine several PDFs into one, in the order you choose. Tap a file in the list to preview it.</p>

  {#if !app.pdfs.length}
    <Dropzone
      id="merge-files"
      accept=".pdf"
      multiple
      main="Choose PDFs to merge"
      sub="Pick the files — the result follows the order in the list, which you can rearrange"
      icon="merge"
      onPick={addPdfs}
    />
  {:else}
    <OrderedList
      items={items}
      onSelect={selectPdfFile}
      onMove={movePdf}
      onRemove={removePdf}
      empty=""
    />
    <div class="actionrow">
      <button type="button" class="btn btn-sm" onclick={() => mergeInput?.click()}>Add more PDFs</button>
    </div>

    {#if previewPdf}
      <div class="mrg-editor">
        <div class="mrg-frame">
          {#if previewPdf.img}
            <img src={previewPdf.img} alt={"Page " + previewPdf.cur + " of " + previewPdf.file.name} />
          {:else if previewPdf.loading}
            <div class="spinner" role="status" aria-label="Rendering page"></div>
          {:else}
            <p class="caption">This PDF can&apos;t be previewed — it will still be merged as-is.</p>
          {/if}
        </div>
        <div class="page-stepper">
          <button
            type="button"
            class="btn btn-sm"
            aria-label="Previous page"
            disabled={!previewPdf.count || previewPdf.cur <= 1}
            onclick={() => stepPdfFile(previewPdf.id, -1)}
          >
            ←
          </button>
          <span class="caption">
            {previewPdf.file.name} · Page {previewPdf.count ? previewPdf.cur : "…"} of {countLabel}
          </span>
          <button
            type="button"
            class="btn btn-sm"
            aria-label="Next page"
            disabled={!previewPdf.count || previewPdf.cur >= previewPdf.count}
            onclick={() => stepPdfFile(previewPdf.id, 1)}
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
      {app.pdfs.length ? app.pdfs.length + " PDF" + (app.pdfs.length > 1 ? "s" : "") + " → one file" : "No PDFs added yet"}
    </span>
    <button
      type="button"
      class="btn btn-primary"
      disabled={!app.pdfs.length || app.busy}
      onclick={() => generate("merge")}
    >
      {app.busy ? "Working…" : "Merge PDFs"}
    </button>
  </div>
</div>
