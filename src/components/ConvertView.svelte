<script>
  /** Convert tab: shared file basket + per-photo modal editor. Crop mode is
   *  explicit: draw the box, press Apply & save, and the thumbnail becomes the
   *  actual cropped photo. Undo restores the original. */
  import Field from "./ui/Field.svelte";
  import Select from "./ui/Select.svelte";
  import Checkbox from "./ui/Checkbox.svelte";
  import FileBasket from "./ui/FileBasket.svelte";
  import CropBox from "./ui/CropBox.svelte";
  import Modal from "./ui/Modal.svelte";
  import { PAGE_DIMS, PAGE_SIZES } from "../lib/domain.js";
  import {
    app,
    addImages,
    cropPreview,
    removeImage,
    revertImage,
    replaceImage,
    updateImage,
    flash,
    generate,
  } from "../lib/store.svelte.js";

  let editing = $state(null); // image id being edited (modal)
  let replaceInput = $state(null);

  const editingImage = $derived(app.images.find((im) => im.id === editing) ?? null);

  const ENHANCE_FILTER = "contrast(1.08) saturate(1.15)"; // matches the modal preview

  const galleryItems = $derived(
    app.images.map((im) => ({
      id: im.id,
      url: im.url,
      name: im.file.name,
      filter: im.enhance ? ENHANCE_FILTER : "none",
    }))
  );

  // Live, approximate preview of the server-side enhancement (auto levels + sharpen).
  const enhancePreview = $derived(editingImage?.enhance ? "contrast(1.08) saturate(1.15)" : "none");

  function applyEdit() {
    if (!editingImage) return;
    if (editingImage.crop) cropPreview(editingImage.id, editingImage.crop);
    editing = null;
    flash("ok", "Saved — the photo now shows what was applied.");
  }

  function undoEdit() {
    if (!editingImage) return;
    revertImage(editingImage.id);
    flash("ok", "Undone — back to the original photo.");
  }

  function pickReplace(e) {
    const file = e.currentTarget.files?.[0];
    if (file && editingImage) {
      replaceImage(editingImage.id, file);
      flash("ok", "File replaced.");
    }
    e.currentTarget.value = "";
  }
</script>

<div class="panel">
  <h2>Convert images to PDF</h2>
  <p class="desc">Turn one or more photos or scans into a single PDF. Each photo becomes one page, and you can crop or enhance each one on its own.</p>

  <FileBasket
    id="convert-files"
    accept=".jpg,.jpeg,.png,.webp,.bmp,.tif,.tiff"
    multiple
    main="Choose images to convert"
    sub="JPG, PNG, WEBP, BMP, TIFF · tap any photo to crop or enhance it"
    icon="convert"
    items={galleryItems}
    editable
    frameAspect={app.pageSize !== "fit" ? PAGE_DIMS[app.pageSize]?.w + "/" + PAGE_DIMS[app.pageSize]?.h : ""}
    onRemove={removeImage}
    onItem={(id) => (editing = id)}
    onPick={addImages}
  />

  <Field label="Paper size" hint={app.pageSize === "fit" ? "Each photo becomes a full page at its own size." : "Each photo becomes one page in this size — the thumbnails show the proportion."}>
    <Select id="page-size" value={app.pageSize} options={PAGE_SIZES} onChange={(v) => (app.pageSize = v)} />
  </Field>

  <div class="actbar">
    <span class="caption">
      {app.images.length
        ? app.images.length + " photo" + (app.images.length > 1 ? "s" : "") + " → one PDF"
        : "No photos added yet"}
    </span>
    <button
      type="button"
      class="btn btn-primary"
      disabled={!app.images.length || app.busy}
      onclick={() => generate("convert")}
    >
      {app.busy ? "Working…" : "Convert to PDF"}
    </button>
  </div>
</div>

{#if editingImage}
  <Modal title={editingImage.file.name} wide onClose={() => (editing = null)}>
    {#if app.images.length > 1}
      <div class="page-stepper">
        <button
          type="button"
          class="btn btn-sm"
          aria-label="Previous photo"
          disabled={!app.images.findIndex((im) => im.id === editingImage.id)}
          onclick={() => {
            const idx = app.images.findIndex((im) => im.id === editingImage.id);
            editing = app.images[Math.max(0, idx - 1)].id;
          }}
        >
          ←
        </button>
        <span class="caption">
          Photo {app.images.findIndex((im) => im.id === editingImage.id) + 1} of {app.images.length}
        </span>
        <button
          type="button"
          class="btn btn-sm"
          aria-label="Next photo"
          disabled={app.images.findIndex((im) => im.id === editingImage.id) >= app.images.length - 1}
          onclick={() => {
            const idx = app.images.findIndex((im) => im.id === editingImage.id);
            editing = app.images[Math.min(app.images.length - 1, idx + 1)].id;
          }}
        >
          →
        </button>
      </div>
    {/if}
    {#key editingImage.id + "-" + (editingImage.crop ? JSON.stringify(editingImage.crop) : "none")}
      <Checkbox
        label="Improve quality"
        hint="Sharpen and boost contrast, good for scans. The preview is approximate — the final enhance runs on the server when you convert."
        checked={editingImage.enhance}
        onChange={(v) => updateImage(editingImage.id, { enhance: v })}
      />
      <div class="centerbox">
        <CropBox
          url={editingImage.url}
          crop={editingImage.crop}
          filter={enhancePreview}
          fitMaxH="55vh"
          onChange={(c) => updateImage(editingImage.id, { crop: c })}
        />
      </div>
    {/key}
    <div class="actionrow">
      <button
        type="button"
        class="btn btn-sm"
        disabled={!editingImage.crop && !editingImage.enhance}
        onclick={undoEdit}
      >
        Undo
      </button>
      <button type="button" class="btn btn-sm" onclick={() => replaceInput?.click()}>Replace…</button>
      <button
        type="button"
        class="btn btn-sm btn-danger"
        onclick={() => {
          if (!confirm("Remove this photo from the list? This cannot be undone.")) return;
          const id = editingImage.id;
          removeImage(id);
          editing = null;
        }}
      >
        Remove
      </button>
      <input bind:this={replaceInput} class="hidden-input" type="file" accept="image/*" onchange={pickReplace} />
    </div>
    <div class="modal-actions">
      <button type="button" class="btn" onclick={() => (editing = null)}>Cancel</button>
      <button type="button" class="btn btn-primary" onclick={applyEdit}>Apply &amp; save</button>
    </div>
  </Modal>
{/if}