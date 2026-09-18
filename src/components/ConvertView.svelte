<script>
  /** Convert tab: gallery of uploaded images with per-image editing
   *  (crop / enhance / replace / remove) and bulk delete. */
  import Field from "./ui/Field.svelte";
  import Select from "./ui/Select.svelte";
  import Checkbox from "./ui/Checkbox.svelte";
  import FilePicker from "./ui/FilePicker.svelte";
  import CropBox from "./ui/CropBox.svelte";
  import Gallery from "./ui/Gallery.svelte";
  import { PAGE_SIZES } from "../lib/domain.js";
  import {
    app,
    addImages,
    removeImage,
    removeImages,
    revertImage,
    replaceImage,
    updateImage,
  } from "../lib/store.svelte.js";

  let editing = $state(null); // image id currently being edited
  let selecting = $state(false);
  let selectedIds = $state([]);
  let replaceInput = $state(null);

  const editingImage = $derived(app.images.find((im) => im.id === editing) ?? null);

  const galleryItems = $derived(
    app.images.map((im) => ({
      id: im.id,
      url: im.url,
      name: im.file.name,
      chips: [...(im.crop ? ["Cropped"] : []), ...(im.enhance ? ["Enhanced"] : [])],
      selected: selectedIds.includes(im.id),
    }))
  );

  const selectedCount = $derived(selectedIds.length);

  // Live, approximate preview of the server-side enhancement (auto levels + sharpen).
  const enhancePreview = $derived(editingImage?.enhance ? "contrast(1.08) saturate(1.15)" : "none");

  function toggleSelect(id) {
    selectedIds = selectedIds.includes(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id];
  }

  function clearSelection() {
    selectedIds = [];
    selecting = false;
  }

  function bulkDelete() {
    if (!selectedIds.length) return;
    if (!confirm("Delete " + selectedCount + " photo" + (selectedCount > 1 ? "s" : "") + "?")) return;
    removeImages(selectedIds);
    clearSelection();
  }

  function pickReplace(e) {
    const file = e.currentTarget.files?.[0];
    if (file && editingImage) replaceImage(editingImage.id, file);
    e.currentTarget.value = "";
  }
</script>

<h2>Convert images to PDF</h2>
<p class="caption">Turn one or more photos or scans into a single PDF. Tap any photo to crop, enhance or replace it.</p>

<FilePicker
  id="convert-files"
  accept=".jpg,.jpeg,.png,.webp,.bmp,.tif,.tiff"
  multiple
  label="Photos or scans"
  hint="Pick one or more. Each photo becomes one page, and you can edit each one individually."
  onPick={addImages}
/>

{#if app.images.length}
  <div class="gbar">
    <span class="caption"><strong>{app.images.length}</strong> photo{app.images.length > 1 ? "s" : ""}</span>
    <span class="gbar-actions">
      {#if selecting}
        <button type="button" class="btn btn-danger" disabled={!selectedCount} onclick={bulkDelete}>
          Delete selected ({selectedCount})
        </button>
        <button type="button" class="btn" onclick={clearSelection}>Cancel</button>
      {:else}
        <button type="button" class="btn" onclick={() => (selecting = true)}>Select…</button>
      {/if}
    </span>
  </div>

  <Gallery
    items={galleryItems}
    selectable={selecting}
    onPick={(id) => (selecting ? toggleSelect(id) : (editing = id))}
    onToggleSelect={toggleSelect}
  />
{/if}

{#if editingImage}
  {#key editingImage.id + "-" + (editingImage.crop ? JSON.stringify(editingImage.crop) : "none")}
    <section class="editor">
      <div class="gbar">
        <h3>Edit: {editingImage.file.name}</h3>
        <button type="button" class="btn" onclick={() => (editing = null)}>Close</button>
      </div>

      <Field
        label="Crop"
        hint="Drag inside the photo to choose what to keep, or drag the corners to resize."
      >
        <CropBox
          url={editingImage.url}
          crop={editingImage.crop}
          filter={enhancePreview}
          onChange={(c) => updateImage(editingImage.id, { crop: c })}
        />
      </Field>

      <Checkbox
        label="Improve quality"
        hint="Sharpen and boost contrast, good for scans. The preview above shows the effect."
        checked={editingImage.enhance}
        onChange={(v) => updateImage(editingImage.id, { enhance: v })}
      />

      <div class="actionrow">
        <button
          type="button"
          class="btn"
          disabled={!editingImage.crop && !editingImage.enhance}
          onclick={() => revertImage(editingImage.id)}
        >
          Use full image
        </button>
        <button type="button" class="btn" onclick={() => replaceInput?.click()}>Replace file…</button>
        <button
          type="button"
          class="btn btn-danger"
          onclick={() => {
            const id = editingImage.id;
            removeImage(id);
            editing = null;
          }}
        >
          Remove photo
        </button>
        <input bind:this={replaceInput} class="hidden-input" type="file" accept="image/*" onchange={pickReplace} />
      </div>
    </section>
  {/key}
{:else if app.images.length}
  <p class="caption">Tap a photo above to crop, enhance or replace it.</p>
{/if}

<Field label="Paper size">
  <Select id="page-size" value={app.pageSize} options={PAGE_SIZES} onChange={(v) => (app.pageSize = v)} />
</Field>
