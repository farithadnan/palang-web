<script>
  /** Convert tab: shared file basket + full-page viewer with full-screen crop
   *  and live enhance. Crop commits on save; the thumbnail is the actual
   *  cropped photo. */
  import Field from "../ui/Field.svelte";
  import Select from "../ui/Select.svelte";
  import ToolHeader from "../ui/ToolHeader.svelte";
  import BusyButton from "../ui/BusyButton.svelte";
  import FileBasket from "../gallery/FileBasket.svelte";
  import FullView from "../gallery/FullView.svelte";
  import CropMode from "../gallery/CropMode.svelte";
  import ResultBar from "../ui/ResultBar.svelte";
  import { PAGE_DIMS, PAGE_SIZES } from "../../lib/domain/domain.js";
  import { t } from "../../lib/i18n/index.js";
  import { ACCEPT } from "../../lib/util/pick.js";
  import { ask } from "../../lib/state/confirm.svelte.js";
  import {
    app,
    addImages,
    cropPreview,
    removeImage,
    updateImage,
    setDefaultPageSize,
    flash,
    generate,
    requestAdd,
  } from "../../lib/state/store.svelte.js";

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

  async function confirmDelete(id) {
    if (await ask({ title: t("cfDeleteImageTitle"), confirmLabel: t("delete"), danger: true })) {
      removeImage(id);
    }
  }

  function viewerCrop(id) {
    viewing = null; // full-screen crop mode takes over
    cropReturn = id;
    cropOpen = id;
  }

  /** Reopen the viewer on a specific image (fixes jumping to the first one —
   *  FullView starts at `viewStart`, so that must move too). */
  function reopenViewer(id) {
    const i = app.images.findIndex((im) => im.id === id);
    if (i >= 0) {
      viewStart = i;
      viewing = id;
    }
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
    if (ret) reopenViewer(ret); // back to the SAME image, not the first
  }

  function viewerEnhance(id) {
    const im = app.images.find((x) => x.id === id);
    if (!im) return;
    const on = !im.enhance;
    updateImage(id, { enhance: on }); // live on/off in the viewer
    flash("ok", on ? t("msgEnhanced") : t("msgEnhanceOff"));
  }
</script>

<div class="panel flat">
  <ToolHeader title={t("cvTitle")} help={t("helpConvert")} onAdd={requestAdd} addLabel={t("addFiles")} />

  <FileBasket
    id="convert-files"
    accept={ACCEPT.images}
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
    <Select id="page-size" value={app.pageSize} options={PAGE_SIZES} onChange={(v) => setDefaultPageSize(v)} />
  </Field>

  <div class="actbar">
    <BusyButton
      busy={app.busy}
      disabled={!app.images.length}
      label={t("cvConvert")}
      busyLabel={t("working")}
      onclick={() => generate("convert")}
    />
  </div>
  <ResultBar />
</div>



{#if viewing !== null && viewingImage}
  <FullView
    items={galleryItems}
    start={viewStart}
    onClose={() => (viewing = null)}
    onDelete={confirmDelete}
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
      if (ret) reopenViewer(ret);
    }}
    onSave={cropSave}
  />
{/if}