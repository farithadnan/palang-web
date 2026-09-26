<script>
  /** Full-screen palang editor (mobile AND desktop). The image fills the
   *  window over a dark stage, the marking stays editable on top (drag /
   *  rotate knob / corner scale / wheel or pinch zoom), and a bottom toolbar
   *  holds the stamp actions. The old bottom form (text, purpose, colour) is
   *  gone — the colour lives in a swatch popover above the toolbar, shown
   *  only when a stamp is actually present.
   *
   *  Top bar: close · mode label (+ page / stamp steppers) · Revert · Save.
   *  Toolbar: Add stamp · Reset position · Fit view · Color · Delete.
   */
  import { t } from "../../lib/i18n.js";
  import Icon from "./Icon.svelte";
  import PalangCanvas from "./PalangCanvas.svelte";
  import {
    app,
    setActivePage,
    updateSpec,
    addSpec,
    removeSpecAt,
    setSpecIndex,
    resetSpec,
    removePreviewFile,
    applyCompiled,
    flash,
  } from "../../lib/store.svelte.js";

  let { onClose } = $props();

  const active = $derived(app.preview?.pages?.[app.activePage] ?? null);
  const pageUrl = $derived(active?.url ?? "");
  const pageReady = $derived(!!(active?.w && active?.h));
  const pages = $derived(app.preview?.pages ?? []);
  const spec = $derived(app.specs[app.specIndex] ?? app.specs[0]);
  const anyArmed = $derived(app.specs.some((s) => s.armed));
  const multi = $derived(app.specs.length > 1);

  // PalangCanvas writes fitView()/resetPosition() into this object on mount.
  let canvasApi = $state({});

  let colorOpen = $state(false);
  // The stamp must be clicked/tapped before the colour and delete actions
  // appear (PalangCanvas reports selection through onSelect).
  let stampSelected = $state(false);
  const COLORS = ["#000000", "#1a3a8f", "#b3261e", "#7a1210", "#1e7b46", "#6b4f16"];

  function add() {
    addSpec(); // the new stamp is auto-selected, per the design
    colorOpen = false;
  }

  function del() {
    colorOpen = false;
    // With more than one stamp, delete the selected stamp.
    if (app.specs.length > 1) {
      removeSpecAt(app.specIndex);
      return;
    }
    // With a single stamp, delete the whole image (and its stamp) instead of
    // leaving a blank page you cannot get rid of.
    const pg = app.preview?.pages?.[app.activePage];
    const fileIdx = pg ? app.previewFiles.indexOf(pg.file) : -1;
    if (fileIdx >= 0) {
      if (app.previewFiles.length === 1) onClose?.();
      removePreviewFile(fileIdx);
    }
  }

  function revert() {
    colorOpen = false;
    if (app.specs.length > 1 || !anyArmed) {
      resetSpec(); // back to one default stamp
    } else {
      updateSpec({ armed: true, topPt: null, leftPt: null, rotationDeg: 0, color: COLORS[0] });
      canvasApi.resetPosition?.();
    }
  }

  function save() {
    onClose?.();
    void applyCompiled().then(() => flash("ok", t("msgReady")));
  }
</script>

<div class="pedit" role="dialog" aria-modal="true" aria-label={t("plPosTitle")}>
  <header class="pedit-top">
    <button type="button" class="iconbtn pedit-ic" aria-label={t("close")} onclick={onClose}>
      <Icon name="x" size={22} />
    </button>
    <span class="pedit-title">{t("palang")}</span>

    {#if pages.length > 1}
      <span class="pedit-step" role="group" aria-label={t("pagePrev")}>
        <button type="button" class="iconbtn iconbtn-xs" aria-label={t("pagePrev")} disabled={app.activePage === 0} onclick={() => setActivePage(app.activePage - 1)}>
          <Icon name="chevL" size={18} />
        </button>
        <span class="pedit-stepcap">Page {app.activePage + 1} of {pages.length}</span>
        <button type="button" class="iconbtn iconbtn-xs" aria-label={t("pageNext")} disabled={app.activePage >= pages.length - 1} onclick={() => setActivePage(app.activePage + 1)}>
          <Icon name="chevR" size={18} />
        </button>
      </span>
    {/if}
    {#if multi}
      <span class="pedit-step" role="group" aria-label={t("plStamps")}>
        <button type="button" class="iconbtn iconbtn-xs" aria-label={t("plStampPrev")} disabled={app.specIndex === 0} onclick={() => setSpecIndex(app.specIndex - 1)}>
          <Icon name="chevL" size={16} />
        </button>
        <span class="pedit-stepcap">Stamp {app.specIndex + 1} of {app.specs.length}</span>
        <button type="button" class="iconbtn iconbtn-xs" aria-label={t("plStampNext")} disabled={app.specIndex >= app.specs.length - 1} onclick={() => setSpecIndex(app.specIndex + 1)}>
          <Icon name="chevR" size={16} />
        </button>
      </span>
    {/if}

    <span class="pedit-spacer"></span>
    <button type="button" class="btn btn-sm" onclick={revert} disabled={!anyArmed}>{t("cmRevert")}</button>
    <button type="button" class="btn btn-sm btn-primary" onclick={save}>{t("cmSave")}</button>
  </header>

  <div class="pedit-stage">
    {#key app.activePage}
      {#if pageUrl && pageReady}
        <PalangCanvas
          class="pedit-canvas"
          bare
          api={canvasApi}
          url={pageUrl}
          widthPt={active.w}
          heightPt={active.h}
          spec={spec}
          fitContain={!!active.url}
          onChange={(patch) => updateSpec(patch)}
          onSelect={(sel) => (stampSelected = sel)}
        />
      {:else if active?.loading}
        <div class="pv-loading" role="status">
          <div class="spinner"></div>
          <p class="caption">{t("plRendering", { n: active.page })}</p>
        </div>
      {:else}
        <div class="pv-loading">
          <p class="caption">{t("plNoPreview")}</p>
        </div>
      {/if}
    {/key}
  </div>

  {#if colorOpen && stampSelected && anyArmed}
    <div class="pedit-colors" role="group" aria-label={t("plColor")}>
      {#each COLORS as c (c)}
        <button
          type="button"
          class="pedit-swatch"
          class:on={spec.color === c}
          style="background:{c}"
          aria-label={t("plColorPick", { c })}
          aria-pressed={spec.color === c}
          onclick={() => updateSpec({ color: c })}
        ></button>
      {/each}
    </div>
  {/if}

  <div class="pedit-toolbar" role="toolbar" aria-label={t("plStamps")}>
    <button type="button" class="pedit-tbtn" aria-label={t("plStampAdd")} onclick={add}>
      <Icon name="plus" size={22} />
      <span class="pedit-tlabel">{t("plStampAdd")}</span>
    </button>
    <button type="button" class="pedit-tbtn" aria-label={t("pcReset")} onclick={() => canvasApi.resetPosition?.()}>
      <Icon name="reset" size={22} />
      <span class="pedit-tlabel">{t("pcReset")}</span>
    </button>
    <button type="button" class="pedit-tbtn" aria-label={t("pcWhole")} onclick={() => canvasApi.fitView?.()}>
      <Icon name="fit" size={22} />
      <span class="pedit-tlabel">{t("pcWhole")}</span>
    </button>
    {#if stampSelected && anyArmed}
      <button type="button" class="pedit-tbtn" class:on={colorOpen} aria-label={t("plColor")} onclick={() => (colorOpen = !colorOpen)}>
        <Icon name="colorwell" size={22} />
        <span class="pedit-tlabel">{t("plColor")}</span>
      </button>
      <button type="button" class="pedit-tbtn pedit-del" aria-label={t("delete")} onclick={del}>
        <Icon name="trash" size={22} />
        <span class="pedit-tlabel">{t("delete")}</span>
      </button>
    {/if}
  </div>
</div>

<style>
  .pedit {
    position: fixed;
    inset: 0;
    z-index: 70;
    height: 100vh;
    background: var(--bg, #0e1116);
    display: flex;
    flex-direction: column;
    color: var(--text);
  }
  .pedit-top {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.8rem;
    border-bottom: 1px solid var(--line);
    background: var(--panel);
    flex-wrap: wrap;
  }
  .pedit-ic { flex: none; }
  .pedit-title { font-size: var(--fs-body); font-weight: 650; white-space: nowrap; }
  .pedit-step {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 0.15rem 0.45rem;
  }
  .pedit-stepcap { font-size: 0.78rem; color: var(--muted); white-space: nowrap; }
  .pedit-spacer { flex: 1; min-width: 0.5rem; }
  .iconbtn-xs {
    min-width: 28px;
    min-height: 28px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 0;
    background: none;
    font: inherit;
  }

  .pedit-stage {
    flex: 1 1 0%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    background: #12151b;
    /* clip zoomed-in overflow so content can never float over the toolbar */
    overflow: hidden;
    position: relative;
  }
  .pedit-stage .pv-loading { border: 0; background: transparent; }
  .pedit-canvas {
    position: absolute;
    inset: 0;
    display: block;
  }
  :global(.pedit-canvas > .canvas-frame) {
    /* fill the stage exactly: an absolutely positioned frame is bounded by the
       stage, so its clientHeight is the available space, never the page content.
       An auto/flex-height frame grew with the zoomed page, re-fitted against a
       bigger frame, and "fit view" did nothing. */
    position: absolute;
    inset: 0;
    min-height: 0;
    max-height: none;
    height: auto;
    border: 0;
    border-radius: 0;
    background: transparent;
  }

  .pedit-colors {
    position: absolute;
    right: 1rem;
    bottom: 5.4rem;
    z-index: 10;
    display: flex;
    gap: 0.5rem;
    align-items: center;
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 0.4rem;
    box-shadow: var(--shadow);
  }
  .pedit-swatch {
    width: 1.9rem;
    height: 1.9rem;
    border-radius: 50%;
    border: 2px solid transparent;
    outline: 1px solid rgba(0, 0, 0, 0.2);
    cursor: pointer;
  }
  .pedit-swatch.on { border-color: var(--accent); }

  .pedit-toolbar {
    display: flex;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.5rem 0.8rem calc(0.5rem + env(safe-area-inset-bottom));
    background: var(--panel);
    border-top: 1px solid var(--line);
  }
  .pedit-tbtn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.15rem;
    min-width: 3.4rem;
    padding: 0.35rem 0.5rem;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--muted);
    font: inherit;
    cursor: pointer;
  }
  .pedit-tbtn:hover { color: var(--text); background: color-mix(in srgb, var(--muted) 10%, transparent); }
  .pedit-tbtn.on { color: var(--accent); }
  .pedit-tlabel { font-size: 0.68rem; font-weight: 600; }
  .pedit-del { color: var(--bad); }
  .pedit-del:hover { color: var(--bad); }

  @media (max-width: 420px) {
    .pedit-tbtn { min-width: 2.9rem; padding: 0.3rem 0.25rem; }
    .pedit-tlabel { display: none; } /* icon-only on phones */
  }
</style>