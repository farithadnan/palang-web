<script>
  /** Merge tab: merge PDFs, or switch to Extract. The preview walks the WHOLE
   *  merged output — every file's pages, in merge order — one page at a time,
   *  and each page can be rotated, moved, or dropped from the output. */
  import ToolHeader from "../ui/ToolHeader.svelte";
  import Dropzone from "../ui/Dropzone.svelte";
  import OrderedList from "../ui/OrderedList.svelte";
  import Segmented from "../ui/Segmented.svelte";
  import Icon from "../ui/Icon.svelte";
  import ResultBar from "../ui/ResultBar.svelte";
  import BusyButton from "../ui/BusyButton.svelte";
  import Skeleton from "../ui/Skeleton.svelte";
  import SplitPanel from "./SplitPanel.svelte";
  import { t } from "../../lib/i18n/index.js";
  import { takeFiles, ACCEPT } from "../../lib/util/pick.js";
  import {
    app,
    addPdfs,
    movePdf,
    removePdf,
    rotateMergePage,
    moveMergePage,
    removeMergePage,
    selectMergeFile,
    stepMerge,
    setMergePage,
    generate,
    canMerge,
    requestAdd,
  } from "../../lib/state/store.svelte.js";

  let mode = $state("merge"); // "merge" | "split"
  let mergeInput = $state(null);
  let fsOpen = $state(false); // fullscreen page preview

  const modeOptions = $derived([
    { id: "merge", label: t("mergeLabel") },
    { id: "split", label: t("splitTab") },
  ]);

  // The topbar "+" is a counter: open the picker only when it CHANGES, or
  // every mount re-opens the chooser by itself.
  let handledTick = app.requestAdd;
  $effect(() => {
    const tick = app.requestAdd;
    if (!tick || tick === handledTick) return;
    handledTick = tick;
    mergeInput?.click();
  });

  function openFs(id) {
    selectMergeFile(id); // jumps the stepper to that file's first page
    fsOpen = true;
  }

  const items = $derived(
    app.pdfs.map((p, i) => ({
      id: p.id,
      label: p.file.name,
      sub: "",
      first: i === 0,
      last: i === app.pdfs.length - 1,
    }))
  );

  const mergePage = $derived(app.merge.pages?.[app.merge.active] ?? null);
  const total = $derived(app.merge.pages.length);

  /** Pages of the CURRENT file — "page k of m" context next to "page n of total". */
  function fileContext() {
    if (!mergePage) return "";
    let fileCount = 0;
    for (const pg of app.merge.pages) if (pg.pdfId === mergePage.pdfId) fileCount++;
    const tags = [
      mergePage.file.name,
      mergePage.page + " of " + fileCount,
      mergePage.err ? t("mgPrevUnavail") : "",
      mergePage.removed ? t("mgRemoved") : "",
    ].filter(Boolean);
    return tags.join(" · ");
  }
</script>

<div class="panel flat">
  {#if mode === "merge"}
    <ToolHeader title={t("mergeLabel")} help={t("helpMerge")} onAdd={requestAdd} addLabel={t("addFiles")} />
  {:else}
    <ToolHeader title={t("splitTitle")} help={t("helpSplit")} />
  {/if}

  <Segmented options={modeOptions} value={mode} onchange={(v) => (mode = v)} label={t("pdfTools")} />

  {#if mode === "merge"}
    <input
      bind:this={mergeInput}
      class="hidden-input"
      id="merge-more"
      type="file"
      accept={ACCEPT.pdf}
      multiple
      onchange={(e) => {
        const picked = takeFiles(e.currentTarget);
        if (picked.length) addPdfs(picked);
      }}
    />

    {#if !app.pdfs.length}
      <Dropzone
        id="merge-files"
        accept={ACCEPT.pdf}
        multiple
        main={t("mgChoose")}
        sub={t("mgPickHint")}
        icon="merge"
        onPick={addPdfs}
        onRequest={() => mergeInput?.click()}
      />
    {:else}
      <OrderedList
        items={items}
        onSelect={openFs}
        onMove={movePdf}
        onRemove={removePdf}
        empty=""
      />
      {#if app.pdfs.length < 2}
        <p class="caption merge-hint">{t("mgNeedMore")}</p>
      {/if}
    {/if}

    <div class="actbar">
      <BusyButton
        busy={app.busy}
        disabled={!canMerge()}
        label={t("mergeLabel")}
        busyLabel={t("working")}
        onclick={() => generate("merge")}
      />
    </div>
  {:else}
    <SplitPanel />
  {/if}

  <ResultBar />
</div>

<style>
  .merge-hint { text-align: center; margin: 0.6rem 0 0; }
  .mgfs {
    position: fixed;
    inset: 0;
    z-index: 60;
    background: var(--bg, #111);
    display: flex;
    flex-direction: column;
    color: var(--text);
  }
  .mgfs-top {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.6rem 0.9rem;
    border-bottom: 1px solid var(--line);
    background: var(--panel);
  }
  .mgfs-name {
    flex: 1;
    font-size: var(--fs-body);
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .mgfs-stage {
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.8rem;
  }
  .mgfs-stage img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border-radius: 6px;
    transition: transform 0.15s ease;
  }
  .mgfs-skel { width: min(70%, 26rem); max-height: 100%; aspect-ratio: 1 / 1.414; }
  .mgfs-bar {
    align-self: center;
    display: flex;
    align-items: center;
    gap: 1rem;
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 0.3rem 0.9rem;
    margin-bottom: 0.5rem;
    box-shadow: var(--shadow);
  }
  .mgfs-ops {
    align-self: center;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 0.3rem;
    margin-bottom: 0.9rem;
    box-shadow: var(--shadow);
  }
  .mgfs-ops .op {
    width: 2.4rem;
    height: 2.4rem;
    border-radius: 50%;
    border: 0;
    background: transparent;
    color: var(--text);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .mgfs-ops .op:hover { background: color-mix(in srgb, var(--muted) 12%, transparent); }
  .mgfs-ops .op:disabled { opacity: 0.4; cursor: default; }
  .mgfs-ops .op.remove { color: var(--bad); }
  .mgfs-ops .op.labelled {
    width: auto;
    height: 2.4rem;
    gap: 0.35rem;
    padding: 0 0.7rem;
    border-radius: 999px;
    font: inherit;
    font-size: var(--fs-btn);
    font-weight: 600;
  }
  .mgfs-range {
    align-self: center;
    width: min(34rem, 88%);
    margin: 0 0 1.4rem;
    accent-color: var(--accent);
  }
</style>

{#if fsOpen && mergePage}
  <div class="mgfs" role="dialog" aria-modal="true" aria-label={t("mergeLabel")}>
    <div class="mgfs-top">
      <button type="button" class="iconbtn" aria-label={t("close")} onclick={() => (fsOpen = false)}>
        <Icon name="x" size={22} />
      </button>
      <span class="mgfs-name" title={fileContext()}>{fileContext()}</span>
      <span style="width:2.2rem"></span>
    </div>
    <div class="mgfs-stage">
      {#if mergePage.url}
        <img
          src={mergePage.url}
          alt={fileContext()}
          style="transform:rotate({mergePage.rotationDeg ?? 0}deg); opacity:{mergePage.removed ? 0.35 : 1}"
        />
      {:else if mergePage.loading}
        <div class="mgfs-skel" role="status" aria-label={t("mgRendering")}>
          <Skeleton height="100%" width="100%" />
        </div>
      {:else}
        <p class="caption">{t("mgNoPreview")}</p>
      {/if}
    </div>
    <div class="mgfs-bar">
      <button
        type="button"
        class="fpill-btn"
        aria-label={t("pagePrev")}
        disabled={app.merge.active <= 0}
        onclick={() => stepMerge(-1)}
      >
        <Icon name="chevL" size={20} />
      </button>
      <span class="caption">Page {app.merge.active + 1} of {total}</span>
      <button
        type="button"
        class="fpill-btn"
        aria-label={t("pageNext")}
        disabled={app.merge.active >= total - 1}
        onclick={() => stepMerge(1)}
      >
        <Icon name="chevR" size={20} />
      </button>
    </div>
    <div class="mgfs-ops" role="toolbar" aria-label={t("mergeLabel")}>
      <button type="button" class="op" aria-label={t("viewRotateLeft")} title={t("viewRotateLeft")} onclick={() => rotateMergePage(app.merge.active, -90)}>
        <Icon name="rotateL" size={18} />
      </button>
      <button type="button" class="op" aria-label={t("viewRotateRight")} title={t("viewRotateRight")} onclick={() => rotateMergePage(app.merge.active, 90)}>
        <Icon name="rotateR" size={18} />
      </button>
      <button
        type="button"
        class="op"
        aria-label={t("olUp")}
        title={t("olUp")}
        disabled={app.merge.active <= 0}
        onclick={() => moveMergePage(app.merge.active, -1)}
      >
        <Icon name="chevL" size={18} />
      </button>
      <button
        type="button"
        class="op"
        aria-label={t("olDown")}
        title={t("olDown")}
        disabled={app.merge.active >= total - 1}
        onclick={() => moveMergePage(app.merge.active, 1)}
      >
        <Icon name="chevR" size={18} />
      </button>
      <button
        type="button"
        class="op labelled {mergePage.removed ? '' : 'remove'}"
        onclick={() => removeMergePage(app.merge.active)}
      >
        <Icon name={mergePage.removed ? "reset" : "trash"} size={16} />
        {mergePage.removed ? t("mgRestore") : t("mgRemove")}
      </button>
    </div>
    {#if total > 1}
      <input
        class="mgfs-range"
        type="range"
        min="1"
        max={total}
        step="1"
        value={app.merge.active + 1}
        aria-label={t("pageJump")}
        oninput={(e) => setMergePage(Number(e.currentTarget.value) - 1)}
      />
    {/if}
  </div>
{/if}
