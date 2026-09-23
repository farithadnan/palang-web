<script>
  /** Palang tab: preview the document's pages, drag/resize the marking, set its text. */
  import Field from "./ui/Field.svelte";
  import FilePicker from "./ui/FilePicker.svelte";
  import PalangCanvas from "./ui/PalangCanvas.svelte";
  import PalangSpecFields from "./ui/PalangSpecFields.svelte";
  import { app, pickPreviewFiles, setActivePage, updateSpec } from "../lib/store.svelte.js";

  const active = $derived(app.preview?.pages?.[app.activePage] ?? null);
  const pageUrl = $derived(active ? "data:image/png;base64," + active.png_base64 : "");
</script>

<h2>Add a palang watermark</h2>
<p class="caption">
  Stamp a purpose bar across your document, or cover a section like an IC number or address. You get a new copy; the original file is untouched.
</p>

<FilePicker
  id="palang-files"
  accept=".pdf,.jpg,.jpeg,.png,.webp,.bmp,.tif,.tiff"
  multiple
  label="Document to stamp"
  hint="A PDF, or images (they are converted to PDF first)."
  onPick={pickPreviewFiles}
/>

{#if app.previewLoading}
  <p class="caption">Rendering pages…</p>
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
        <img src={"data:image/png;base64," + page.png_base64} alt="" />
      </button>
    {/each}
  </div>
  {#if app.preview.truncated}<p class="caption">Showing the first 20 pages.</p>{/if}
  {#if active}
    {#key app.activePage + "-" + app.spec.mode + "-" + app.spec.style + "-" + (app.spec.text || "") + "-" + (app.spec.second || "")}
      <Field
        label={"Page " + active.page + " preview"}
        hint={app.spec.style === "lines"
          ? "Transparent marking: the lines hug your text. Drag it to position it."
          : "Drag the marking to position it; drag its handles to resize. Changes apply to the pages you choose below."}
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
  <p class="caption">Upload a document to see its pages here. Move the marking where you want it, then press Generate.</p>
{/if}

<div class="divider"></div>
<PalangSpecFields spec={app.spec} showGeometry={false} onChange={(patch) => updateSpec(patch)} />
