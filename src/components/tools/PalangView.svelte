<script>
  /** Palang tab: file basket; tapping a file opens the full-screen placement
   *  editor (PalangEditor): the image fills the window and the stamp actions
   *  live in a bottom toolbar. */
  import { t } from "../../lib/i18n/index.js";
  import { ACCEPT } from "../../lib/util/pick.js";
  import { PAGE_DIMS } from "../../lib/domain/domain.js";
  import ToolHeader from "../ui/ToolHeader.svelte";
  import FileBasket from "../gallery/FileBasket.svelte";
  import BusyButton from "../ui/BusyButton.svelte";
  import ResultBar from "../ui/ResultBar.svelte";
  import PalangEditor from "../palang/PalangEditor.svelte";
  import {
    app,
    pickPreviewFiles,
    removePreviewFile,
    retryPreview,
    setActivePage,
    ensureFileThumb,
    generate,
    requestAdd,
  } from "../../lib/state/store.svelte.js";

  const basketItems = $derived(
    app.previewFiles.map((f, i) => {
      const isImg = f.type?.startsWith("image/");
      const thumb = app.fileThumbs.get(f);
      return {
        id: "pf-" + i,
        name: f.name,
        // Images show their object URL; a PDF shows its first-page render once
        // the queued thumbnail is ready. While either is pending, a skeleton
        // holds the space so the grid never jumps.
        url: isImg ? app.preview?.pages?.find((p) => p.file === f)?.url : thumb || undefined,
        loading: app.previewLoading || (!isImg && thumb !== ""),
        icon: isImg ? "convert" : "file",
      };
    })
  );

  $effect(() => {
    // Request first-page thumbnails for PDFs (queued + cached in the store).
    for (const f of app.previewFiles) {
      if (!f.type?.startsWith("image/")) void ensureFileThumb(f);
    }
  });

  let editing = $state(false);

  // After ~5s of rendering, reassure the user the app is still working.
  let slow = $state(false);
  $effect(() => {
    if (!app.previewLoading) {
      slow = false;
      return;
    }
    const t = setTimeout(() => (slow = true), 5000);
    return () => clearTimeout(t);
  });

  function removeDocument() {
    while (app.previewFiles.length) removePreviewFile(0);
  }
</script>

<div class="panel flat">
  <ToolHeader title={t("plTitle")} help={t("helpPalang")} onAdd={requestAdd} addLabel={t("addFiles")} />

  <FileBasket
    id="palang-files"
    accept={ACCEPT.pdfAndImages}
    multiple
    main={t("plChoose")}
    icon="palang"
    requestAddTick={app.requestAdd}
    items={basketItems}
    frameAspect={app.pageSize !== "fit" ? PAGE_DIMS[app.pageSize]?.w + "/" + PAGE_DIMS[app.pageSize]?.h : ""}
    onRemove={(id) => removePreviewFile(Number(id.replace("pf-", "")))}
    onItem={(id) => {
      // Open the editor on the tapped file, not the first one.
      setActivePage(Number(id.replace("pf-", "")));
      editing = true;
    }}
    onPick={pickPreviewFiles}
  />

  {#if app.previewFiles.length}
    {#if app.previewLoading}
      {#if slow}
        <p class="caption" style="text-align:center">{t("plStillPreparing")}</p>
      {/if}
    {:else if !app.preview}
      <div class="retrycard">
        <p class="desc">{t("plUnable")}</p>
        <div class="actionrow">
          <button type="button" class="btn btn-primary btn-sm" onclick={() => void retryPreview()}>{t("plTryAgain")}</button>
          <button type="button" class="btn btn-sm" onclick={removeDocument}>{t("plChooseOther")}</button>
        </div>
      </div>
    {/if}
  {/if}

  <div class="actbar">
    <BusyButton
      busy={app.busy}
      disabled={!app.previewFiles.length}
      label={t("plStamp")}
      busyLabel={t("plWorking")}
      onclick={() => generate("palang")}
    />
  </div>
  <ResultBar />
</div>

{#if editing}
  <PalangEditor onClose={() => (editing = false)} />
{/if}