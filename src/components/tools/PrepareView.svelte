<script>
  /** Prepare — stage 1 of the unified pipeline. ONE mixed basket (images and
   *  PDFs) with a single export sheet: paper size, an optional purpose stamp,
   *  merge-all vs one file per item, and the output name. The per-item editors
   *  (crop / rotate / enhance / drag placement) live in the existing tools
   *  until stage 2 folds them in here. */
  import Field from "../ui/Field.svelte";
  import Select from "../ui/Select.svelte";
  import Checkbox from "../ui/Checkbox.svelte";
  import ToolHeader from "../ui/ToolHeader.svelte";
  import BusyButton from "../ui/BusyButton.svelte";
  import FileBasket from "../gallery/FileBasket.svelte";
  import ResultBar from "../ui/ResultBar.svelte";
  import { PAGE_DIMS, PAGE_SIZES } from "../../lib/domain/domain.js";
  import { t } from "../../lib/i18n/index.js";
  import { ACCEPT } from "../../lib/util/pick.js";
  import {
    app,
    addPrepareFiles,
    removePrepareItem,
    movePrepareItem,
    setPrepare,
    generatePrepare,
    requestAdd,
  } from "../../lib/state/store.svelte.js";

  const items = $derived(
    app.prepare.items.map((it) => ({
      id: it.id,
      name: it.file.name,
      url: it.url ?? undefined,
      icon: it.kind === "pdf" ? "file" : "convert",
      loading: it.kind === "pdf" && !it.pageCount,
    }))
  );

  const frameAspect = $derived(
    app.prepare.paper !== "fit"
      ? PAGE_DIMS[app.prepare.paper]?.w + "/" + PAGE_DIMS[app.prepare.paper]?.h
      : ""
  );
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
    {items}
    {frameAspect}
    onRemove={removePrepareItem}
    onMove={movePrepareItem}
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

<style>
  .prepare-checks {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    margin: 0.4rem 0 1rem;
  }
</style>
