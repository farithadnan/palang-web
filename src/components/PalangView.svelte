<script>
  /** Palang tab: file basket; tapping a file opens the full-screen placement
   *  editor (PalangEditor): the image fills the window and the stamp actions
   *  live in a bottom toolbar. */
  import { t } from "../lib/i18n.js";
  import { ACCEPT } from "../lib/pick.js";
  import ToolHeader from "./ui/ToolHeader.svelte";
  import FileBasket from "./ui/FileBasket.svelte";
  import BusyButton from "./ui/BusyButton.svelte";
  import ResultBar from "./ui/ResultBar.svelte";
  import PalangEditor from "./ui/PalangEditor.svelte";
  import {
    app,
    pickPreviewFiles,
    removePreviewFile,
    retryPreview,
    setActivePage,
    generate,
  } from "../lib/store.svelte.js";

  const basketItems = $derived(
    app.previewFiles.map((f, i) => ({
      id: "pf-" + i,
      name: f.name,
      // Images shown instantly get a real thumbnail from their object URL.
      url: f.type?.startsWith("image/") && app.preview?.client ? app.preview.pages[i]?.url : undefined,
      icon: f.type?.startsWith("image/") ? "convert" : "file",
    }))
  );

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
  <ToolHeader title={t("plTitle")} />

  <FileBasket
    id="palang-files"
    accept={ACCEPT.pdfAndImages}
    multiple
    main={t("plChoose")}
    icon="palang"
    requestAddTick={app.requestAdd}
    items={basketItems}
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
      <div class="spinner" role="status" aria-label={t("plPreparing")}></div>
      <p class="caption" style="text-align:center">
        {slow ? t("plStillPreparing") : t("plPreparingEll")}
      </p>
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