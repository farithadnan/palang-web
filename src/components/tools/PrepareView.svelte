<script>
  /** Prepare — the unified pipeline. ONE mixed basket (images and PDFs) with a
   *  single export sheet. Images are edited here (crop / rotate / enhance),
   *  reusing the ONE preview renderer shared with Convert; PDFs export as-is.
   *  Drag placement of the purpose band is the next stage. */
  import Field from "../ui/Field.svelte";
  import Select from "../ui/Select.svelte";
  import Checkbox from "../ui/Checkbox.svelte";
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
    addPrepareFiles,
    removePrepareItem,
    movePrepareItem,
    rotatePrepareImage,
    cropPrepareImage,
    togglePrepareEnhance,
    setPrepare,
    generatePrepare,
    flash,
    requestAdd,
  } from "../../lib/state/store.svelte.js";

  const ENHANCE_FILTER = "contrast(1.08) saturate(1.15)";

  let viewing = $state(null); // image id open in the viewer
  let cropOpen = $state(null);
  let viewStart = $state(0);
  let cropReturn = $state(null);

  const galleryItems = $derived(
    app.prepare.items.map((it) => ({
      id: it.id,
      name: it.file.name,
      url: it.url ?? undefined,
      icon: it.kind === "pdf" ? "file" : "convert",
      loading: it.kind === "pdf" && !it.pageCount,
      filter: it.enhance ? ENHANCE_FILTER : "none",
    }))
  );

  const viewingItem = $derived(app.prepare.items.find((it) => it.id === viewing) ?? null);
  const cropItem = $derived(app.prepare.items.find((it) => it.id === cropOpen) ?? null);

  const frameAspect = $derived(
    app.prepare.paper !== "fit"
      ? PAGE_DIMS[app.prepare.paper]?.w + "/" + PAGE_DIMS[app.prepare.paper]?.h
      : ""
  );

  function openViewer(id) {
    const it = app.prepare.items.find((x) => x.id === id);
    if (!it || it.kind !== "image") return; // PDFs are exported as-is
    viewStart = Math.max(0, app.prepare.items.findIndex((x) => x.id === id));
    viewing = id;
  }

  async function confirmDelete(id) {
    if (await ask({ title: t("cfDeleteImageTitle"), confirmLabel: t("delete"), danger: true })) {
      removePrepareItem(id);
    }
  }

  function viewerCrop(id) {
    viewing = null;
    cropReturn = id;
    cropOpen = id;
  }

  function reopenViewer(id) {
    const i = app.prepare.items.findIndex((x) => x.id === id);
    if (i >= 0) {
      viewStart = i;
      viewing = id;
    }
  }

  function cropSave(rect) {
    const ret = cropReturn;
    cropReturn = null;
    if (rect && cropOpen) {
      cropPrepareImage(cropOpen, rect);
      flash("ok", t("msgSaved"));
    }
    cropOpen = null;
    if (ret) reopenViewer(ret);
  }

  function viewerEnhance(id) {
    const it = app.prepare.items.find((x) => x.id === id);
    if (!it) return;
    togglePrepareEnhance(id);
    flash("ok", !it.enhance ? t("msgEnhanced") : t("msgEnhanceOff"));
  }
</script>

<div class="panel flat">
  <ToolHeader
    title={t("prepareTitle")}
    help={t("helpPrepare")}
    onAdd={requestAdd}
    addLabel={t("addFiles")}
  />

  <FileBasket
    id="prepare-files"
    accept={ACCEPT.pdfAndImages}
    multiple
    main={t("prepareChoose")}
    icon="prepare"
    requestAddTick={app.requestAdd}
    items={galleryItems}
    {frameAspect}
    onRemove={removePrepareItem}
    onMove={movePrepareItem}
    onItem={openViewer}
    onPick={addPrepareFiles}
  />

  <Field label={t("preparePaper")}>
    <Select
      id="prepare-paper"
      value={app.prepare.paper}
      options={PAGE_SIZES}
      onChange={(v) => setPrepare({ paper: v })}
    />
  </Field>

  <div class="prepare-checks">
    <Checkbox
      label={t("prepareMerge")}
      hint={t("prepareMergeHint")}
      checked={app.prepare.merge}
      onChange={(v) => setPrepare({ merge: v })}
    />
    <Checkbox
      label={t("prepareStamp")}
      checked={app.prepare.stamp}
      onChange={(v) => setPrepare({ stamp: v })}
    />
  </div>

  {#if app.prepare.stamp}
    <Field label={t("prepareStampText")}>
      <input
        type="text"
        value={app.prepare.stampText}
        oninput={(e) => setPrepare({ stampText: e.currentTarget.value })}
      />
    </Field>
  {/if}

  <Field label={t("prepareFilename")} hint={t("prepareFilenameHint")}>
    <input
      type="text"
      value={app.prepare.filename}
      placeholder="palang-prepared"
      oninput={(e) => setPrepare({ filename: e.currentTarget.value })}
    />
  </Field>

  <div class="actbar">
    <BusyButton
      busy={app.busy}
      disabled={!app.prepare.items.length}
      label={t("prepareExport")}
      busyLabel={t("working")}
      onclick={generatePrepare}
    />
  </div>
  <ResultBar />
</div>

{#if viewing !== null && viewingItem}
  <FullView
    items={galleryItems}
    start={viewStart}
    onClose={() => (viewing = null)}
    onDelete={confirmDelete}
    onCrop={viewerCrop}
    onRotate={rotatePrepareImage}
    onEnhance={viewerEnhance}
  />
{/if}

{#if cropOpen && cropItem}
  <CropMode
    url={cropItem.baseUrl}
    filter={cropItem.enhance ? ENHANCE_FILTER : "none"}
    crop={cropItem.crop ?? null}
    onClose={() => {
      const ret = cropReturn;
      cropReturn = null;
      cropOpen = null;
      if (ret) reopenViewer(ret);
    }}
    onSave={cropSave}
  />
{/if}

<style>
  .prepare-checks {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    margin: 0.4rem 0 1rem;
  }
</style>
