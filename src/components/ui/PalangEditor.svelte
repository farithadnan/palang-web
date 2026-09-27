<script>
  /** Full-screen palang editor (mobile AND desktop). ONE palang per image: the
   *  image fills the window over a dark stage, the marking is editable on top
   *  (drag / rotate knob / corner scale / wheel or pinch zoom), a bottom
   *  toolbar holds the stamp actions, and double-clicking the stamp text edits
   *  it inline (a transparent field on the page).
   *
   *  Top bar: close · mode label (+ page stepper) · Revert · Save.
   *  Toolbar: Reset position · Fit view · Colour (when the stamp is selected)
   *           · Remove this palang (per image) · Remove this image.
   */
  import { t } from "../../lib/i18n.js";
  import { ask } from "../../lib/confirm.svelte.js";
  import Icon from "./Icon.svelte";
  import PalangCanvas from "./PalangCanvas.svelte";
  import {
    app,
    setActivePage,
    updateSpec,
    specFor,
    removeStamp,
    removePreviewFile,
    applyCompiled,
    flash,
  } from "../../lib/store.svelte.js";

  let { onClose } = $props();

  const active = $derived(app.preview?.pages?.[app.activePage] ?? null);
  const activeFile = $derived(active?.file ?? null);
  const spec = $derived(specFor(activeFile));
  // Read armed off the reactive map directly (a chained $derived on the spec
  // object caches by reference, so nested armed mutations don't re-run it).
  const armed = $derived(!!app.stamp[app.previewFiles.indexOf(activeFile)]?.armed);
  const pageUrl = $derived(active?.url ?? "");
  const pageReady = $derived(!!(active?.w && active?.h));
  const pages = $derived(app.preview?.pages ?? []);

  let canvasApi = $state({});
  let colorOpen = $state(false);
  let moreOpen = $state(false);
  let stampSelected = $state(false);
  const COLORS = ["#000000", "#1a3a8f", "#b3261e", "#7a1210", "#1e7b46", "#6b4f16"];

  function addPalang() {
    colorOpen = false;
    moreOpen = false;
    updateSpec({ armed: true, topPt: null, leftPt: null, rotationDeg: 0 });
    stampSelected = true;
    canvasApi.resetPosition?.();
  }

  async function removePalang() {
    colorOpen = false;
    moreOpen = false;
    if (
      !(await ask({
        title: t("cfRemovePalangTitle"),
        body: t("cfRemovePalangBody"),
        confirmLabel: t("plRemoveStamp"),
        danger: true,
      }))
    )
      return;
    removeStamp(); // this image keeps, but exports unstamped
    stampSelected = false;
  }

  async function removeImage() {
    colorOpen = false;
    moreOpen = false;
    if (!(await ask({ title: t("cfDeleteImageTitle"), confirmLabel: t("delete"), danger: true }))) return;
    const pg = app.preview?.pages?.[app.activePage];
    const fileIdx = pg ? app.previewFiles.indexOf(pg.file) : -1;
    if (fileIdx >= 0) {
      if (app.previewFiles.length === 1) onClose?.();
      removePreviewFile(fileIdx);
    }
  }

  async function revert() {
    colorOpen = false;
    moreOpen = false;
    if (!(await ask({ title: t("cfRevertTitle"), body: t("cfRevertBody"), confirmLabel: t("cmRevert") }))) return;
    updateSpec({ armed: true, topPt: null, leftPt: null, rotationDeg: 0, color: COLORS[0] });
    canvasApi.resetPosition?.();
  }

  function save() {
    onClose?.();
    void applyCompiled().then(() => flash("ok", t("msgReady")));
  }

  function removeMenu(fn) {
    moreOpen = false;
    fn();
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
        <button
          type="button"
          class="iconbtn iconbtn-xs"
          aria-label={t("pagePrev")}
          disabled={app.activePage === 0}
          onclick={() => setActivePage(app.activePage - 1)}
        >
          <Icon name="chevL" size={18} />
        </button>
        <span class="pedit-stepcap">Page {app.activePage + 1} of {pages.length}</span>
        <button
          type="button"
          class="iconbtn iconbtn-xs"
          aria-label={t("pageNext")}
          disabled={app.activePage >= pages.length - 1}
          onclick={() => setActivePage(app.activePage + 1)}
        >
          <Icon name="chevR" size={18} />
        </button>
      </span>
    {/if}

    <span class="pedit-spacer"></span>
    <button type="button" class="btn btn-sm" onclick={revert} disabled={!armed}>{t("cmRevert")}</button>
    <button type="button" class="btn btn-sm btn-primary" onclick={save}>{t("cmSave")}</button>
  </header>

  <div class="pedit-stage">
    {#key app.activePage + "-" + (armed ? "1" : "0")}
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
        {#if !armed}
          <button type="button" class="pedit-add" onclick={addPalang}>
            <Icon name="plus" size={20} />
            {t("plStampAdd")}
          </button>
          <p class="pedit-addcap">{t("plNoPalangHere")}</p>
        {/if}
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

  {#if colorOpen && stampSelected && armed}
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
    {#if armed}
      <button type="button" class="pedit-tbtn" aria-label={t("pcReset")} onclick={() => canvasApi.resetPosition?.()}>
        <Icon name="reset" size={22} />
        <span class="pedit-tlabel">{t("pcReset")}</span>
      </button>
      <button type="button" class="pedit-tbtn" aria-label={t("pcWhole")} onclick={() => canvasApi.fitView?.()}>
        <Icon name="fit" size={22} />
        <span class="pedit-tlabel">{t("pcWhole")}</span>
      </button>
      {#if spec.mode === "band" && spec.style === "lines"}
        <button
          type="button"
          class="pedit-tbtn"
          aria-label={t("plEditText")}
          title={t("plEditText")}
          onclick={() => canvasApi.editText?.()}
        >
          <Icon name="pencil" size={22} />
          <span class="pedit-tlabel">{t("plEditText")}</span>
        </button>
      {/if}
      {#if stampSelected}
        <button
          type="button"
          class="pedit-tbtn"
          class:on={colorOpen}
          aria-label={t("plColor")}
          onclick={() => (colorOpen = !colorOpen)}
        >
          <Icon name="colorwell" size={22} />
          <span class="pedit-tlabel">{t("plColor")}</span>
        </button>
      {/if}
      <span class="pedit-sep" aria-hidden="true"></span>
      <span class="pedit-more">
        <button
          type="button"
          class="pedit-tbtn"
          class:on={moreOpen}
          aria-label={t("more")}
          title={t("more")}
          aria-expanded={moreOpen}
          onclick={() => (moreOpen = !moreOpen)}
        >
          <Icon name="more" size={22} />
          <span class="pedit-tlabel">{t("more")}</span>
        </button>
        {#if moreOpen}
          <div class="pedit-menu" role="menu">
            <button type="button" role="menuitem" class="pedit-mi pedit-del" onclick={() => removeMenu(removePalang)}>
              {t("plRemoveStamp")}
            </button>
            <button type="button" role="menuitem" class="pedit-mi pedit-del" onclick={() => removeMenu(removeImage)}>
              {t("plRemoveImage")}
            </button>
          </div>
        {/if}
      </span>
    {:else}
      <button type="button" class="pedit-tbtn pedit-del" aria-label={t("plRemoveImage")} onclick={removeImage}>
        <Icon name="trash" size={22} />
        <span class="pedit-tlabel">{t("plRemoveImage")}</span>
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
    overflow: hidden;
    position: relative;
  }
  .pedit-stage .pv-loading { border: 0; background: transparent; }
  :global(.pedit-canvas > .canvas-frame) {
    position: absolute;
    inset: 0;
    min-height: 0;
    max-height: none;
    height: auto;
    border: 0;
    border-radius: 0;
    background: transparent;
  }
  .pedit-add {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    z-index: 5;
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.6rem 1.1rem;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--panel);
    color: var(--text);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
    box-shadow: var(--shadow);
  }
  .pedit-addcap {
    position: absolute;
    left: 0;
    right: 0;
    top: calc(50% + 2.6rem);
    text-align: center;
    color: var(--muted);
    font-size: 0.85rem;
    margin: 0;
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
    flex-wrap: wrap;
  }
  .pedit-tbtn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.15rem;
    min-width: 3.6rem;
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

  /* destructive actions live behind one overflow menu, so the toolbar stays
     short and the primary tools are not crowded by removals */
  .pedit-sep { width: 1px; align-self: stretch; background: var(--line); margin: 0 0.2rem; }
  .pedit-more { position: relative; display: inline-flex; }
  .pedit-menu {
    position: absolute;
    bottom: calc(100% + 8px);
    right: 0;
    z-index: 20;
    min-width: 12rem;
    display: flex;
    flex-direction: column;
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 10px;
    box-shadow: var(--shadow);
    padding: 0.3rem;
  }
  .pedit-mi {
    text-align: left;
    background: none;
    border: 0;
    color: var(--text);
    font: inherit;
    font-size: var(--fs-body);
    padding: 0.5rem 0.6rem;
    border-radius: 7px;
    cursor: pointer;
  }
  .pedit-mi:hover { background: color-mix(in srgb, var(--muted) 10%, transparent); }
  .pedit-mi.pedit-del { color: var(--bad); }

  @media (max-width: 420px) {
    .pedit-tbtn { min-width: 2.9rem; padding: 0.3rem 0.25rem; }
    .pedit-tlabel { display: none; } /* icon-only on phones */
  }
</style>