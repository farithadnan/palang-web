<script>
  /** Convert tab: shared file basket + per-photo modal editor. Crop mode is
   *  explicit: draw the box, press Apply & save, and the thumbnail becomes the
   *  actual cropped photo. Undo restores the original. */
  import Field from "./ui/Field.svelte";
  import Select from "./ui/Select.svelte";
  import Checkbox from "./ui/Checkbox.svelte";
  import FileBasket from "./ui/FileBasket.svelte";
  import FullView from "./ui/FullView.svelte";
  import CropBox from "./ui/CropBox.svelte";
  import Modal from "./ui/Modal.svelte";
  import { PAGE_DIMS, PAGE_SIZES } from "../lib/domain.js";
  import { t } from "../lib/i18n.js";
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

  let editing = $state(null); // image id being edited (crop/enhance modal)
  let viewing = $state(null); // image id open in the full-page viewer
  let viewStart = $state(0);
  let replaceInput = $state(null);

  const editingImage = $derived(app.images.find((im) => im.id === editing) ?? null);
  const viewingImage = $derived(app.images.find((im) => im.id === viewing) ?? null);

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
    flash("ok", t("cvSaved"));
  }

  function undoEdit() {
    if (!editingImage) return;
    revertImage(editingImage.id);
    flash("ok", t("cvUndone"));
  }

  function pickReplace(e) {
    const file = e.currentTarget.files?.[0];
    if (file && editingImage) {
      replaceImage(editingImage.id, file);
      flash("ok", t("cvReplaced"));
    }
    e.currentTarget.value = "";
  }
  function openViewer(id) {
    viewStart = Math.max(0, app.images.findIndex((im) => im.id === id));
    viewing = id;
  }

  function viewerCrop(id) {
    viewing = null; // the crop/enhance modal takes over (step 3 replaces it)
    editing = id;
  }

  function viewerEnhance(id) {
    const im = app.images.find((x) => x.id === id);
    if (im) updateImage(id, { enhance: !im.enhance }); // live on/off in the viewer
  }
</script>

<div class="panel flat">
  <h2>{t("cvTitle")}</h2>

  <FileBasket
    id="convert-files"
    accept=".jpg,.jpeg,.png,.webp,.bmp,.tif,.tiff"
    multiple
    main={t("cvChoose")}
    icon="convert"
    requestAddTick={app.requestAdd}
    items={galleryItems}
    frameAspect={app.pageSize !== "fit" ? PAGE_DIMS[app.pageSize]?.w + "/" + PAGE_DIMS[app.pageSize]?.h : ""}
    onRemove={removeImage}
    onItem={openViewer}
    onPick={addImages}
  />

  <Field label={t("cvPaperSize")} hint={app.pageSize === "fit" ? t("cvPageOwn") : t("cvPageFit")}>
    <Select id="page-size" value={app.pageSize} options={PAGE_SIZES} onChange={(v) => (app.pageSize = v)} />
  </Field>

  <div class="actbar">
    <span class="caption">
      {app.images.length
        ? app.images.length + " photo" + (app.images.length > 1 ? "s" : "") + " → one PDF"
        : t("cvEmpty")}
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
          aria-label={t("cvPrev")}
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
          aria-label={t("cvNext")}
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
        label={t("cvImprove")}
        hint={t("cvImproveHint")}
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
          if (!confirm(t("cvRemoveConfirm"))) return;
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

{#if viewing !== null && viewingImage}
  <FullView
    items={galleryItems}
    start={viewStart}
    onClose={() => (viewing = null)}
    onDelete={removeImage}
    onCrop={viewerCrop}
    onEnhance={viewerEnhance}
  />
{/if}