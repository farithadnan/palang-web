<script>
  /** Merge tab: dropzone + ordered PDF list + bottom action bar. */
  import Dropzone from "./ui/Dropzone.svelte";
  import OrderedList from "./ui/OrderedList.svelte";
  import { app, addPdfs, movePdf, removePdf, generate } from "../lib/store.svelte.js";

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
</script>

<div class="panel">
  <h2>Merge PDFs</h2>
  <p class="desc">Combine several PDFs into one, in the order you choose.</p>

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
    <OrderedList items={items} onMove={movePdf} onRemove={removePdf} empty="" />
    <div class="mrg-preview" aria-label="Merged output preview">
      {#each app.pdfs as p (p.id)}
        {#if p.pages.length}
          {#each p.pages as url, pi (p.id + "-" + pi)}
            <figure class="mrg-page">
              <img src={url} alt="" loading="lazy" />
              <figcaption>
                {p.file.name} · {pi + 1}
              </figcaption>
            </figure>
          {/each}
        {:else if p.thumbErr}
          <figure class="mrg-page mrg-err">
            <span>pdf</span>
            <figcaption>{p.file.name} · preview unavailable</figcaption>
          </figure>
        {:else}
          <figure class="mrg-page">
            <span class="mrg-loading"></span>
            <figcaption>{p.file.name} · …</figcaption>
          </figure>
        {/if}
      {/each}
    </div>
    <div class="actionrow">
      <button type="button" class="btn btn-sm" onclick={() => mergeInput?.click()}>Add more PDFs</button>
    </div>
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
