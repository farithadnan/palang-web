<script>
  /** Convert tab: shared file basket + full-page viewer with full-screen crop
   *  and live enhance. Crop commits on save; the thumbnail is the actual
   *  cropped photo. */
  import Field from "./ui/Field.svelte";
  import Select from "./ui/Select.svelte";
  import FileBasket from "./ui/FileBasket.svelte";
  import FullView from "./ui/FullView.svelte";
  import CropMode from "./ui/CropMode.svelte";
  import ResultBar from "./ui/ResultBar.svelte";
  import { PAGE_DIMS, PAGE_SIZES } from "../lib/domain.js";
  import { t } from "../lib/i18n.js";
  import {
    app,
    addImages,
    cropPreview,
    removeImage,
    updateImage,
    flash,
    generate,
  } from "../lib/store.svelte.js";

  let viewing = $state(null); // image id open in the full-page viewer
  let cropOpen = $state(null); // image id in full-screen crop mode
  let viewStart = $state(0);
  let cropReturn = $state(null); // reopen the viewer after crop save/cancel

  const viewingImage = $derived(app.images.find((im) => im.id === viewing) ?? null);
  const cropImage = $derived(app.images.find((im) => im.id === cropOpen) ?? null);

  const ENHANCE_FILTER = "contrast(1.08) saturate(1.15)"; // matches the modal preview

  const galleryItems = $derived(
    app.images.map((im) => ({
      id: im.id,
      url: im.url,
      name: im.file.name,
      filter: im.enhance ? ENHANCE_FILTER : "none",
    }))
  );

  function openViewer(id) {
    viewStart = Math.max(0, app.images.findIndex((im) => im.id === id));
    viewing = id;
  }

  function viewerCrop(id) {
    viewing = null; // full-screen crop mode takes over
    cropReturn = id;
    cropOpen = id;
  }

  function cropSave(rect) {
    const ret = cropReturn;
    cropReturn = null;
    if (rect && cropOpen) {
      updateImage(cropOpen, { crop: rect });
      cropPreview(cropOpen, rect);
      flash("ok", t("msgSaved"));
    }
    cropOpen = null;
    if (ret && app.images.some((im) => im.id === ret)) viewing = ret; // back to the viewer
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
    <button
      type="button"
      class="btn btn-primary"
      disabled={!app.images.length || app.busy}
      onclick={() => generate("convert")}
    >
      {app.busy ? t("working") : t("cvConvert")}
    </button>
  </div>
  <ResultBar />
</div>



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

{#if cropOpen && cropImage}
  <CropMode
    url={cropImage.url}
    filter={cropImage.enhance ? ENHANCE_FILTER : "none"}
    crop={cropImage.crop ?? null}
    onClose={() => {
      const ret = cropReturn;
      cropReturn = null;
      cropOpen = null;
      if (ret && app.images.some((im) => im.id === ret)) viewing = ret;
    }}
    onSave={cropSave}
  />
{/if}